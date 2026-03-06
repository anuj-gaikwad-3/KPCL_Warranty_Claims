from fastapi import APIRouter, HTTPException
from app.dashboard.data_engine import engine

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/trends")
async def get_trends(fy: str = None):
    try:
        return {"status": "success", "data": engine.get_overview_trends(selected_fy=fy)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/kpis")
async def get_kpis(fy: str = None):
    try:
        return {"status": "success", "data": engine.get_kpi_stats(selected_fy=fy)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/complaints")
async def get_complaints_data(fy: str = None):
    try:
        return {"status": "success", "data": engine.get_complaints_page_data(selected_fy=fy)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def get_data_summary():
    if engine.df is None:
        raise HTTPException(status_code=404, detail="Dataset not loaded")
    return {
        "total_records": len(engine.df),
        "columns": list(engine.df.columns),
        "date_range": {
            "start": str(engine.df['complaint_date'].min()),
            "end": str(engine.df['complaint_date'].max()),
        },
    }


@router.get("/zhc")
async def get_zhc_data(fy: str = None):
    try:
        return {"status": "success", "data": engine.get_zhc_page_data(selected_fy=fy)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/usage")
async def get_usage_data(fy: str = None):
    try:
        return {"status": "success", "data": engine.get_usage_page_data(selected_fy=fy)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/fys")
async def get_fys():
    if engine.df is None:
        raise HTTPException(status_code=404, detail="Dataset not loaded")
    fys = sorted(engine.df['fy_year'].unique())
    return {"fys": fys}
