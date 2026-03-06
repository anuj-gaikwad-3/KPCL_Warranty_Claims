CURATED_PLOTS = {
    "total_complaints_forecast": [
        (
            "plot1_overview.png",
            "Full History + Forecast Overview",
            "Complete timeline of monthly complaints spanning the entire data period with train/test/forecast regions clearly marked",
            "hero",
        ),
        (
            "plot2_actual_vs_predicted.png",
            "Actual vs Predicted — Validation",
            "How closely each algorithm tracked real complaint counts during the holdout test period",
            "supporting",
        ),
        (
            "plot4_model_comparison.png",
            "Algorithm Leaderboard",
            "Head-to-head comparison of all forecasting algorithms ranked by test MAE",
            "supporting",
        ),
        (
            "plot3_forecast_detail.png",
            "3-Month Forecast Detail",
            "Zoomed-in view of recent history with the forward-looking forecast projection",
            "supporting",
        ),
        (
            "plot5_decomposition.png",
            "Trend & Seasonality Decomposition",
            "The underlying trend, seasonal cycle and residual noise separated from raw data",
            "supporting",
        ),
        (
            "plot6_feature_importance.png",
            "Feature Importance — LightGBM",
            "Which time-series features drive the LightGBM model's predictions most",
            "supporting",
        ),
    ],
    "model_wise": [
        (
            "plot_top_models_line_forecast.png",
            "Top Models — Trend + Forecast",
            "Historical complaint trajectory and 3-month forecast for the highest-volume product models",
            "hero",
        ),
        (
            "plot_forecast_heatmap.png",
            "Forecast Intensity Heatmap",
            "Cross-model, cross-month intensity map revealing which models are expected to peak when",
            "supporting",
        ),
        (
            "plot_holdout_mae_per_model.png",
            "Holdout Accuracy by Model",
            "Mean Absolute Error per product model on the holdout period — lower is better",
            "supporting",
        ),
        (
            "plot_top_models.png",
            "Top 10 Models by Volume",
            "The ten models with the highest predicted complaint volumes in the forecast window",
            "supporting",
        ),
        (
            "plot_holdout_total_comparison.png",
            "Aggregate Validation",
            "Total actual vs total predicted complaints per month across all models in holdout",
            "supporting",
        ),
        (
            "plot_holdout_scatter.png",
            "Prediction Consistency",
            "Scatter plot showing how well predictions align with actuals — closer to diagonal is better",
            "supporting",
        ),
    ],
    "complaint_type_forecast": [
        (
            "forecast_by_type_with_intervals.png",
            "Forecast by Type — Confidence Bands",
            "Category-level predictions with P10-P90 confidence intervals showing forecast uncertainty",
            "hero",
        ),
        (
            "forecast_cost_by_type.png",
            "Estimated Warranty Cost by Type",
            "Predicted warranty cost breakdown by complaint type based on most-likely replacement parts",
            "supporting",
        ),
        (
            "historical_category_distribution.png",
            "Historical Category Distribution",
            "How complaint categories are distributed across the full historical dataset",
            "supporting",
        ),
        (
            "model_type_share_distribution.png",
            "Type Share by Model",
            "Stacked breakdown of complaint type proportions for each product model",
            "supporting",
        ),
        (
            "forecast_heatmaps_top_models.png",
            "Type x Month Heatmaps",
            "Detailed heatmaps showing expected complaint type volumes for the top forecast models",
            "supporting",
        ),
    ],
}
