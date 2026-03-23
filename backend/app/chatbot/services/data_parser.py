import pandas as pd
import logging
from app.chatbot.config import settings

logger = logging.getLogger(__name__)

global_df = None
global_kb_df = None
global_cost_df = None


def get_dataframes():
    global global_df, global_kb_df, global_cost_df

    if global_df is None:
        logger.info(f"Loading Main Warranty data from: {settings.ACTIVE_DATA_PATH}")
        df = pd.read_excel(settings.ACTIVE_DATA_PATH)
        df.columns = df.columns.astype(str).str.strip()

        numeric_cols = ['RunHrs.', 'RPM', 'Period DD to DC in months', 'FSR No']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        global_df = df

    if global_kb_df is None:
        logger.info(f"Loading Knowledge Base from: {settings.KB_DATA_PATH}")
        df_kb = pd.read_excel(settings.KB_DATA_PATH)
        df_kb = df_kb.iloc[:, :4]

        kb_names = ['Sr. No.', 'Problem category', 'Due to Supplier/In-house', 'Probable Causes']
        df_kb.columns = kb_names[:len(df_kb.columns)]

        for col in df_kb.columns:
            if df_kb[col].dtype == 'object':
                df_kb[col] = df_kb[col].astype(str).str.strip()
        global_kb_df = df_kb

    if global_cost_df is None:
        logger.info(f"Loading Spare Part Costs from: {settings.COST_DATA_PATH}")
        df_cost = pd.read_excel(settings.COST_DATA_PATH)
        df_cost = df_cost.iloc[:, :6]

        cost_names = ['ITEM DESCRIPTION', 'QTY', 'UNIT PRICE', 'BASIC VALUE', 'TAX VALUE', 'GROSS VALUE']
        df_cost.columns = cost_names[:len(df_cost.columns)]

        if 'GROSS VALUE' in df_cost.columns:
            df_cost['GROSS VALUE'] = pd.to_numeric(df_cost['GROSS VALUE'], errors='coerce')
        if 'ITEM DESCRIPTION' in df_cost.columns:
            df_cost['ITEM DESCRIPTION'] = df_cost['ITEM DESCRIPTION'].astype(str).str.strip()

        global_cost_df = df_cost

    return global_df, global_kb_df, global_cost_df


def find_relevant_context(user_query: str, include_costs: bool = True):
    try:
        df, df_kb, df_cost = get_dataframes()

        raw_query = user_query.lower().replace('-', ' ').replace('_', ' ').strip()

        stop_words = {
            "how", "many", "what", "are", "the", "for", "and", "with", "from",
            "based", "column", "tell", "about", "were", "logged", "this", "that",
            "year", "date", "which", "who", "why",
        }
        keywords = [k for k in raw_query.split() if len(k) > 2 and k not in stop_words]

        if not keywords:
            return {
                "filtered_kb": [],
                "filtered_warranty": [],
                "cost_table_str": "",
                "df_columns": list(df.columns) if not df.empty else [],
            }

        def keyword_match(cell_value):
            if pd.isna(cell_value):
                return False
            val = str(cell_value).lower()
            return any(k in val for k in keywords)

        matched_kb = []
        if 'Problem category' in df_kb.columns:
            kb_mask = df_kb['Problem category'].apply(keyword_match)
            kb_cols = [c for c in ['Problem category', 'Probable Causes'] if c in df_kb.columns]
            matched_kb = df_kb.loc[kb_mask, kb_cols].head(5).to_dict('records')

        matched_warranty = []
        if 'Nature of complaint' in df.columns:
            warranty_mask = df['Nature of complaint'].apply(keyword_match)
            warr_cols = [c for c in ['Nature of complaint', 'Spares / Part Replaced'] if c in df.columns]
            matched_warranty = df.loc[warranty_mask, warr_cols].tail(5).to_dict('records')
        else:
            logger.warning("'Nature of complaint' column is missing from Warranty Excel!")

        cost_table_str = "[Cost data omitted — not a cost query]"
        if include_costs and not df_cost.empty:
            cols_to_show = [c for c in ['ITEM DESCRIPTION', 'UNIT PRICE', 'GROSS VALUE'] if c in df_cost.columns]
            cost_table_str = df_cost[cols_to_show].to_string(index=False)

        return {
            "filtered_kb": matched_kb,
            "filtered_warranty": matched_warranty,
            "cost_table_str": cost_table_str,
            "df_columns": list(df.columns) if not df.empty else [],
        }

    except Exception as e:
        logger.error(f"CRITICAL ERROR in find_relevant_context: {str(e)}", exc_info=True)
        return {
            "filtered_kb": [],
            "filtered_warranty": [],
            "cost_table_str": f"System error reading Excel files: {str(e)}",
            "df_columns": [],
        }


def execute_agent_code(python_code: str) -> dict:
    try:
        df, df_kb, df_cost = get_dataframes()
    except Exception as e:
        return {"error": f"Failed to load files: {str(e)}"}

    local_env = {
        "df": df,
        "df_kb": df_kb,
        "df_cost": df_cost,
        "pd": pd,
        "final_answer": "No answer generated.",
        "graph_json": None,
    }

    if "px" in python_code or "plotly" in python_code:
        import plotly.express as px
        local_env["px"] = px

    try:
        exec(python_code, {}, local_env)
    except Exception as e:
        return {"error": str(e), "failed_code": python_code}

    ans = str(local_env.get("final_answer"))
    g_json = local_env.get("graph_json")

    if ans.startswith('{"data":') or ans.startswith('{"layout":'):
        g_json = ans
        ans = "Here is the requested graph."

    return {"answer": ans, "graph_json": g_json, "error": None}
