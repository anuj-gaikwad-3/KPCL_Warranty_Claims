import pandas as pd
import numpy as np
import logging
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from app.forecasting.curated_plots import CURATED_PLOTS
from urllib.parse import quote

logger = logging.getLogger(__name__)

router = APIRouter()

BASE_DIR = Path(__file__).parent.parent.parent
_FORECAST_DIR_CANDIDATES = [
    BASE_DIR / "data" / "forecast_outputs",
    BASE_DIR / "data" / "forecasting_outputs",
]
OUTPUT_DIR = next((p for p in _FORECAST_DIR_CANDIDATES if p.exists()), _FORECAST_DIR_CANDIDATES[0])


def safe_read(filepath: Path) -> pd.DataFrame:
    if not filepath.exists():
        raise HTTPException(status_code=404, detail=f"Data file not found: {filepath.name}")
    return pd.read_csv(filepath)


def format_month(date_str: str) -> str:
    try:
        dt = pd.to_datetime(date_str)
        return dt.strftime("%b %Y")
    except Exception:
        return str(date_str)


def _safe_resolve_in_output_dir(path: Path) -> Path:
    """
    Prevent directory traversal by ensuring final resolved path stays under OUTPUT_DIR.
    """
    base = OUTPUT_DIR.resolve()
    resolved = path.resolve()
    try:
        resolved.relative_to(base)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid path")
    return resolved


def _media_type_for(filename: str) -> str:
    fn = filename.lower()
    if fn.endswith(".png"):
        return "image/png"
    if fn.endswith(".csv"):
        return "text/csv"
    if fn.endswith(".html") or fn.endswith(".htm"):
        return "text/html"
    if fn.endswith(".json"):
        return "application/json"
    return "application/octet-stream"


@router.get("/health")
async def forecast_health():
    return {"status": "online", "message": "KPCL Forecasting service is running"}


@router.get("/overview")
def get_overview():
    try:
        total_fc = safe_read(OUTPUT_DIR / "total_complaints_forecast" / "forecast_3month.csv")
        total_av = safe_read(OUTPUT_DIR / "total_complaints_forecast" / "actual_vs_predicted.csv")
        model_fc = safe_read(OUTPUT_DIR / "model_wise" / "model_wise_forecasts.csv")
        model_comp = safe_read(OUTPUT_DIR / "total_complaints_forecast" / "model_comparison.csv")
        type_fc = safe_read(OUTPUT_DIR / "complaint_type_forecast" / "complaint_type_forecasts.csv")

        next_row = total_fc.iloc[0]
        next_month = str(next_row["Month"])
        next_ensemble = float(next_row["Ensemble (Top-3)"])

        # "Best" column is schema-dependent. Support old and new output formats.
        best_candidates = [
            "Best (Holt-Winters)",
            "Best (Prophet) Raw",
            "Best (Prophet)",
            "Best (SARIMA)",
            "Best_p50",
        ]
        best_col = next((c for c in best_candidates if c in total_fc.columns), None)
        if best_col:
            next_best = float(next_row[best_col])
        else:
            # Fallback: use ensemble when no explicit best column exists
            next_best = next_ensemble

        three_month_total = float(total_fc["Ensemble (Top-3)"].sum())

        next_month_date = sorted(model_fc["Complaint Date"].unique().tolist())[0]
        next_month_models = model_fc[model_fc["Complaint Date"] == next_month_date]
        top_model_row = next_month_models.sort_values("predicted_complaints", ascending=False).iloc[0]

        best_algo = model_comp.iloc[0]

        unique_models = int(model_fc["Model_masked"].nunique())
        unique_types = int(type_fc["Complaint_Type"].nunique())
        forecast_months = total_fc["Month"].tolist()

        avg_actual = float(total_av["Actual"].mean())
        avg_ensemble = float(total_av["Ensemble (Top-3)"].mean())
        accuracy_pct = max(0, round(100 - abs(avg_ensemble - avg_actual) / max(avg_actual, 1) * 100, 1))

        # KPI chip expects a percentage change.
        if len(total_fc) >= 2:
            m0 = float(total_fc["Ensemble (Top-3)"].iloc[0])
            m1 = float(total_fc["Ensemble (Top-3)"].iloc[1])
            mom_change = ((m1 - m0) / max(abs(m0), 1.0)) * 100.0
        else:
            mom_change = 0.0

        last_actual = float(total_av["Actual"].iloc[-1])

        return {
            "next_month": next_month,
            "next_month_forecast": round(next_ensemble, 1),
            "next_month_best": round(next_best, 1),
            "three_month_total": round(three_month_total, 1),
            "top_model": str(top_model_row["Model_masked"]),
            "top_model_value": int(top_model_row["predicted_complaints"]),
            "total_models_tracked": unique_models,
            "total_complaint_types": unique_types,
            "best_algorithm": str(best_algo["Model"]),
            "best_algo_mae": round(float(best_algo["Test MAE"]), 2),
            "forecast_months": forecast_months,
            "validation_accuracy_pct": accuracy_pct,
            "mom_change": round(mom_change, 1),
            "last_actual": last_actual,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/total_complaints")
def get_total_complaints():
    try:
        forecast_df = safe_read(OUTPUT_DIR / "total_complaints_forecast" / "forecast_3month.csv")
        actual_df = safe_read(OUTPUT_DIR / "total_complaints_forecast" / "actual_vs_predicted.csv")
        comparison_df = safe_read(OUTPUT_DIR / "total_complaints_forecast" / "model_comparison.csv")

        return {
            "forecast": forecast_df.to_dict(orient="records"),
            "actuals": actual_df.to_dict(orient="records"),
            "comparison": comparison_df.to_dict(orient="records"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model_wise")
def get_model_wise(model_name: Optional[str] = None, month: Optional[str] = None):
    try:
        df = safe_read(OUTPUT_DIR / "model_wise" / "model_wise_forecasts.csv")

        if model_name:
            df = df[df["Model_masked"] == model_name]
        if month:
            df = df[df["Complaint Date"] == month]

        records = df.to_dict(orient="records")
        for r in records:
            r["month_label"] = format_month(r["Complaint Date"])
            # Frontend expects generic p10/p90 keys for charting; keep predicted_* too.
            if "p10" not in r and "predicted_p10" in r:
                r["p10"] = r["predicted_p10"]
            if "p90" not in r and "predicted_p90" in r:
                r["p90"] = r["predicted_p90"]

        return {
            "forecasts": records,
            "available_months": sorted(
                safe_read(OUTPUT_DIR / "model_wise" / "model_wise_forecasts.csv")["Complaint Date"].unique().tolist()
            ),
            "available_models": sorted(
                safe_read(OUTPUT_DIR / "model_wise" / "model_wise_forecasts.csv")["Model_masked"].unique().tolist()
            ),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model_wise/validation")
def get_model_wise_validation():
    try:
        summary = safe_read(OUTPUT_DIR / "model_wise" / "holdout_evaluation_summary.csv")
        return {"summary": summary.to_dict(orient="records")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/complaint_types")
def get_complaint_types(month: Optional[str] = None, model: Optional[str] = None):
    try:
        df = safe_read(OUTPUT_DIR / "complaint_type_forecast" / "complaint_type_forecasts.csv")

        if month:
            df = df[df["Date"] == month]
        if model:
            df = df[df["Model"] == model]

        agg = (
            df.groupby("Complaint_Type")
            .agg(
                total_p50=("Forecast_p50", "sum"),
                total_p10=("Forecast_p10", "sum"),
                total_p90=("Forecast_p90", "sum"),
                model_count=("Model", "nunique"),
            )
            .reset_index()
            .sort_values("total_p50", ascending=False)
        )

        records = df.to_dict(orient="records")
        # Frontend aliases: some pages expect Est_Unit_Cost but outputs may use Est_Avg_Cost.
        for r in records:
            if "Est_Unit_Cost" not in r and "Est_Avg_Cost" in r:
                r["Est_Unit_Cost"] = r["Est_Avg_Cost"]

        return {
            "raw": records,
            "aggregated": agg.to_dict(orient="records"),
            "available_months": sorted(
                safe_read(OUTPUT_DIR / "complaint_type_forecast" / "complaint_type_forecasts.csv")["Date"].unique().tolist()
            ),
            "available_types": sorted(
                safe_read(OUTPUT_DIR / "complaint_type_forecast" / "complaint_type_forecasts.csv")["Complaint_Type"].unique().tolist()
            ),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/complaint_types/validation")
def get_complaint_type_validation():
    try:
        val = safe_read(OUTPUT_DIR / "complaint_type_forecast" / "table1_validation.csv")
        future = safe_read(OUTPUT_DIR / "complaint_type_forecast" / "table2_future_forecast.csv")
        return {
            "validation": val.to_dict(orient="records"),
            "future_forecast": future.to_dict(orient="records"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/complaint_types/costs")
def get_complaint_type_costs(month: Optional[str] = None, model: Optional[str] = None):
    try:
        df = safe_read(OUTPUT_DIR / "complaint_type_forecast" / "complaint_type_forecasts.csv")

        if month:
            df = df[df["Date"] == month]
        if model:
            df = df[df["Model"] == model]

        has_cost = "Est_Cost_p50" in df.columns

        by_type = (
            df.groupby("Complaint_Type")
            .agg(
                total_complaints_p50=("Forecast_p50", "sum"),
                total_cost_p50=("Est_Cost_p50", "sum") if has_cost else ("Forecast_p50", "sum"),
                models_affected=("Model", "nunique"),
            )
            .sort_values("total_cost_p50" if has_cost else "total_complaints_p50", ascending=False)
            .reset_index()
        )

        by_model = (
            df.groupby("Model")
            .agg(
                total_complaints_p50=("Forecast_p50", "sum"),
                total_cost_p50=("Est_Cost_p50", "sum") if has_cost else ("Forecast_p50", "sum"),
                types_count=("Complaint_Type", "nunique"),
            )
            .sort_values("total_cost_p50" if has_cost else "total_complaints_p50", ascending=False)
            .reset_index()
        )

        cost_summary_path = OUTPUT_DIR / "complaint_type_forecast" / "cost_forecast_summary.csv"
        cost_summary: list[dict] = []
        if cost_summary_path.exists():
            cost_summary = pd.read_csv(cost_summary_path).to_dict(orient="records")
            # Frontend expects friendlier keys in the detail table.
            for r in cost_summary:
                if "unit_cost" not in r and "avg_cost_per_complaint" in r:
                    r["unit_cost"] = r["avg_cost_per_complaint"]
                if "Models_Affected" not in r and "models_affected" in r:
                    r["Models_Affected"] = r["models_affected"]

        records = df.to_dict(orient="records")
        for r in records:
            if "Est_Unit_Cost" not in r and "Est_Avg_Cost" in r:
                r["Est_Unit_Cost"] = r["Est_Avg_Cost"]

        total_cost = float(df["Est_Cost_p50"].sum()) if has_cost else 0

        payload = {
            "raw": records,
            "by_type": by_type.to_dict(orient="records"),
            "by_model": by_model.to_dict(orient="records"),
            "cost_summary": cost_summary,
            "total_estimated_cost": total_cost,
            "total_estimated_cost_lakhs": round(total_cost / 1e5, 2),
            "available_months": sorted(
                safe_read(OUTPUT_DIR / "complaint_type_forecast" / "complaint_type_forecasts.csv")["Date"].unique().tolist()
            ),
        }
        # Explicit JSONResponse helps some clients (and debugging tools) parse reliably.
        return JSONResponse(content=payload)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/plots/{category}/{filename}")
def get_plot(category: str, filename: str):
    plot_path = OUTPUT_DIR / category / filename
    plot_path = _safe_resolve_in_output_dir(plot_path)
    if plot_path.exists():
        return FileResponse(plot_path, media_type=_media_type_for(filename))
    raise HTTPException(status_code=404, detail="Plot not found")


@router.get("/curated_plots")
def get_curated_plots():
    """
    Returns the plot gallery used by forecasting pages.

    - Uses CURATED_PLOTS for preferred labeling/ordering/roles (hero/supporting)
    - Also auto-discovers any additional *.png files present under forecast_outputs
      so newly generated plots appear without code changes.
    """
    result: dict = {}

    # Start with curated entries (if present on disk)
    for cat_key, entries in CURATED_PLOTS.items():
        plots: list[dict] = []
        seen = set()
        for filename, label, desc, role in entries:
            filepath = OUTPUT_DIR / cat_key / filename
            if filepath.exists():
                seen.add(filename)
                plots.append(
                    {
                        "filename": filename,
                        "label": label,
                        "description": desc,
                        "role": role,
                        "url": f"/api/v1/forecast/plots/{quote(cat_key)}/{quote(filename)}",
                    }
                )

        # Auto-discover additional PNGs
        cat_dir = OUTPUT_DIR / cat_key
        if cat_dir.exists() and cat_dir.is_dir():
            for p in sorted(cat_dir.glob("*.png")):
                if p.name in seen:
                    continue
                plots.append(
                    {
                        "filename": p.name,
                        "label": p.stem.replace("_", " ").title(),
                        "description": "Auto-discovered plot from forecast outputs",
                        "role": "supporting",
                        "url": f"/api/v1/forecast/plots/{quote(cat_key)}/{quote(p.name)}",
                    }
                )

        if plots:
            cat_label = cat_key.replace("_", " ").title()
            result[cat_key] = {"label": cat_label, "plots": plots}

    # Also include any categories that exist on disk but aren't in CURATED_PLOTS
    if OUTPUT_DIR.exists():
        for cat_dir in sorted([p for p in OUTPUT_DIR.iterdir() if p.is_dir()]):
            cat_key = cat_dir.name
            if cat_key in result:
                continue
            plots = [
                {
                    "filename": p.name,
                    "label": p.stem.replace("_", " ").title(),
                    "description": "Auto-discovered plot from forecast outputs",
                    "role": "hero" if i == 0 else "supporting",
                    "url": f"/api/v1/forecast/plots/{quote(cat_key)}/{quote(p.name)}",
                }
                for i, p in enumerate(sorted(cat_dir.glob("*.png")))
            ]
            if plots:
                result[cat_key] = {"label": cat_key.replace("_", " ").title(), "plots": plots}

    return result


@router.get("/outputs_index")
def get_outputs_index():
    """
    Full index of everything available under forecast_outputs.
    Frontend doesn't have to use this, but it's useful for verifying that the server
    is reading *all* updated outputs (csv/png/html) without hardcoding filenames.
    """
    if not OUTPUT_DIR.exists():
        raise HTTPException(status_code=404, detail="forecast_outputs directory not found")

    index: dict[str, dict] = {}
    for cat_dir in sorted([p for p in OUTPUT_DIR.iterdir() if p.is_dir()]):
        files = []
        for p in sorted(cat_dir.iterdir()):
            if not p.is_file():
                continue
            if p.suffix.lower() not in {".csv", ".png", ".html", ".htm", ".json"}:
                continue
            files.append(
                {
                    "filename": p.name,
                    "type": p.suffix.lower().lstrip("."),
                    "size_bytes": p.stat().st_size,
                    "url": f"/api/v1/forecast/plots/{quote(cat_dir.name)}/{quote(p.name)}",
                }
            )
        index[cat_dir.name] = {"label": cat_dir.name.replace("_", " ").title(), "files": files}

    return {"output_dir": str(OUTPUT_DIR), "categories": index}


@router.get("/insights")
def get_insights():
    insights = {}

    try:
        total_fc = safe_read(OUTPUT_DIR / "total_complaints_forecast" / "forecast_3month.csv")
        total_av = safe_read(OUTPUT_DIR / "total_complaints_forecast" / "actual_vs_predicted.csv")
        model_comp = safe_read(OUTPUT_DIR / "total_complaints_forecast" / "model_comparison.csv")

        best = model_comp.iloc[0]
        worst = model_comp.iloc[-1]
        fc_values = total_fc["Ensemble (Top-3)"].values
        trend = "increasing" if fc_values[-1] > fc_values[0] else "decreasing" if fc_values[-1] < fc_values[0] else "steady"
        avg_fc = np.mean(fc_values)

        insights["total"] = {
            "headline": f"Expecting ~{avg_fc:.0f} complaints/month over the next quarter",
            "trend": f"The complaint trajectory is {trend}, moving from {fc_values[0]:.0f} to {fc_values[-1]:.0f} over the 3-month forecast window.",
            "accuracy": f"{best['Model']} leads with a test MAE of {best['Test MAE']:.2f}, while {worst['Model']} trails at {worst['Test MAE']:.2f}.",
            "validation": f"During the holdout period, the ensemble correctly predicted within {abs(total_av['Actual'].mean() - total_av['Ensemble (Top-3)'].mean()):.1f} complaints on average.",
        }
    except Exception:
        insights["total"] = {"headline": "Total complaints forecast loaded", "trend": "", "accuracy": "", "validation": ""}

    try:
        model_fc = safe_read(OUTPUT_DIR / "model_wise" / "model_wise_forecasts.csv")
        months = sorted(model_fc["Complaint Date"].unique())
        first_month = months[0]
        top5 = model_fc[model_fc["Complaint Date"] == first_month].nlargest(5, "predicted_complaints")
        top_names = top5["Model_masked"].tolist()
        top_total = int(top5["predicted_complaints"].sum())
        all_total = int(model_fc[model_fc["Complaint Date"] == first_month]["predicted_complaints"].sum())
        pct = round(top_total / max(all_total, 1) * 100, 0)

        insights["models"] = {
            "headline": f"Top 5 models account for ~{pct:.0f}% of predicted complaints",
            "top_models": f"The highest-risk models are {', '.join(top_names[:3])}, expected to generate {top_total} complaints next month.",
            "coverage": f"Across {len(model_fc['Model_masked'].unique())} tracked models, the forecast covers {len(months)} months ahead.",
            "spread": f"Prediction intervals suggest uncertainty ranges of +/-{int(model_fc['predicted_p90'].mean() - model_fc['predicted_p10'].mean())} complaints on average.",
        }
    except Exception:
        insights["models"] = {"headline": "Model analysis loaded", "top_models": "", "coverage": "", "spread": ""}

    try:
        type_fc = safe_read(OUTPUT_DIR / "complaint_type_forecast" / "complaint_type_forecasts.csv")
        type_agg = type_fc.groupby("Complaint_Type")["Forecast_p50"].sum().sort_values(ascending=False)
        top_type = type_agg.index[0]
        top_type_val = int(type_agg.iloc[0])
        total_typed = int(type_agg.sum())
        n_types = len(type_agg)

        insights["types"] = {
            "headline": f'"{top_type}" dominates with {top_type_val} predicted complaints',
            "distribution": f"Across {n_types} categories, the top 3 types account for {int(type_agg.head(3).sum())} of {total_typed} total predicted complaints.",
            "coverage": f"Forecasts span {type_fc['Model'].nunique()} models x {type_fc['Date'].nunique()} months x {n_types} complaint categories.",
            "action": f"Focus resources on {top_type} and {type_agg.index[1] if n_types > 1 else 'N/A'} for maximum impact reduction.",
        }
    except Exception:
        insights["types"] = {"headline": "Complaint type analysis loaded", "distribution": "", "coverage": "", "action": ""}

    return insights


@router.get("/metadata")
def get_metadata():
    try:
        total_fc = safe_read(OUTPUT_DIR / "total_complaints_forecast" / "forecast_3month.csv")
        model_fc = safe_read(OUTPUT_DIR / "model_wise" / "model_wise_forecasts.csv")
        type_fc = safe_read(OUTPUT_DIR / "complaint_type_forecast" / "complaint_type_forecasts.csv")

        return {
            "forecast_months": total_fc["Month"].tolist(),
            "model_months": sorted(model_fc["Complaint Date"].unique().tolist()),
            "models": sorted(model_fc["Model_masked"].unique().tolist()),
            "complaint_types": sorted(type_fc["Complaint_Type"].unique().tolist()),
            "type_months": sorted(type_fc["Date"].unique().tolist()),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------
# Data endpoints used by the standalone forecasting UI (/forecasting)
# ---------------------------------------------------------------------


@router.get("/data/decomposition")
def get_decomposition_data():
    try:
        path = OUTPUT_DIR / "total_complaints_forecast" / "decomposition_data.csv"
        df = safe_read(path)
        # Keep payload small + consistent
        cols = [c for c in ["Month", "Observed", "Trend", "Seasonal", "Residual"] if c in df.columns]
        if cols:
            df = df[cols]
        # JSON must not contain NaN/Inf; convert to nulls.
        df = df.replace([np.inf, -np.inf], np.nan).where(pd.notna(df), None)
        return df.dropna(how="all").to_dict(orient="records")
    except HTTPException:
        raise
    except Exception:
        return []


@router.get("/data/feature_importance")
def get_feature_importance_data():
    try:
        path = OUTPUT_DIR / "total_complaints_forecast" / "feature_importance.csv"
        df = safe_read(path)
        return df.dropna(how="all").to_dict(orient="records")
    except HTTPException:
        raise
    except Exception:
        return []


@router.get("/data/heatmap")
def get_heatmap_data():
    try:
        path = OUTPUT_DIR / "model_wise" / "forecast_heatmap_data.csv"
        df = safe_read(path)
        return df.dropna(how="all").to_dict(orient="records")
    except HTTPException:
        raise
    except Exception:
        return []


@router.get("/data/complaint_types")
def get_complaint_type_data():
    try:
        df = safe_read(OUTPUT_DIR / "complaint_type_forecast" / "complaint_type_forecasts.csv")
        if {"Complaint_Type", "Forecast_p10", "Forecast_p50", "Forecast_p90"}.issubset(df.columns):
            summary = (
                df.groupby("Complaint_Type", as_index=False)
                .agg(Forecast_p10=("Forecast_p10", "sum"), Forecast_p50=("Forecast_p50", "sum"), Forecast_p90=("Forecast_p90", "sum"))
            )
            return summary.to_dict(orient="records")
        return df.to_dict(orient="records")
    except HTTPException:
        raise
    except Exception:
        return []


@router.get("/data/cost_analysis")
def get_cost_analysis_data():
    try:
        path = OUTPUT_DIR / "complaint_type_forecast" / "cost_forecast_summary.csv"
        df = safe_read(path)
        return df.dropna(how="all").to_dict(orient="records")
    except HTTPException:
        raise
    except Exception:
        return []


@router.get("/data/type_distribution")
def get_type_distribution_data():
    try:
        df = safe_read(OUTPUT_DIR / "complaint_type_forecast" / "complaint_type_forecasts.csv")
        if {"Complaint_Type", "Forecast_p50"}.issubset(df.columns):
            dist = df.groupby("Complaint_Type", as_index=False).agg(Count=("Forecast_p50", "sum")).rename(columns={"Complaint_Type": "Category"})
            dist = dist.sort_values("Count", ascending=False)
            return dist.to_dict(orient="records")
        return []
    except HTTPException:
        raise
    except Exception:
        return []


@router.get("/data/type_shares")
def get_type_shares_data():
    try:
        df = safe_read(OUTPUT_DIR / "complaint_type_forecast" / "model_type_shares.csv")
        return df.dropna(how="all").to_dict(orient="records")
    except HTTPException:
        raise
    except Exception:
        return []


@router.get("/data/scatter")
def get_scatter_data():
    try:
        df = safe_read(OUTPUT_DIR / "model_wise" / "holdout_evaluation.csv")
        return df.dropna(how="all").to_dict(orient="records")
    except HTTPException:
        raise
    except Exception:
        return []


@router.get("/data/model_wise_history")
def get_model_wise_history():
    """
    Historical + forecast data for model-wise line charts.
    """
    try:
        forecast_df = safe_read(OUTPUT_DIR / "model_wise" / "model_wise_forecasts.csv")
        history_path = OUTPUT_DIR / "model_wise" / "actual_vs_predicted_test_modelwise.csv"

        history: list[dict] = []
        if history_path.exists():
            history = pd.read_csv(history_path).dropna(how="all").to_dict(orient="records")

        top_models = (
            forecast_df.groupby("Model_masked")["predicted_complaints"]
            .sum()
            .sort_values(ascending=False)
            .head(10)
            .index.tolist()
        )

        return {
            "history": history,
            "forecasts": forecast_df.dropna(how="all").to_dict(orient="records"),
            "top_models": top_models,
        }
    except HTTPException:
        raise
    except Exception:
        return {"history": [], "forecasts": [], "top_models": []}


@router.get("/data/unified_history")
def get_unified_history():
    """
    Full historical + forecast complaint type data for trend charts (if present).
    """
    try:
        path = OUTPUT_DIR / "complaint_type_forecast" / "unified_history_forecast.csv"
        if not path.exists():
            return []
        df = pd.read_csv(path)
        return df.dropna(how="all").to_dict(orient="records")
    except Exception:
        return []
