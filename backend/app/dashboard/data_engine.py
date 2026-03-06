import pandas as pd
import pathlib
import re


class WarrantyDataEngine:
    def __init__(self, file_path):
        self.file_path = file_path
        self.df = None
        self.load_data()

    def load_data(self):
        base_path = pathlib.Path(__file__).parent.parent.parent
        full_path = base_path / "data" / "dashboard" / self.file_path

        print(f"Loading data from: {full_path}")
        self.df = pd.read_excel(full_path)

        self.df.columns = [c.strip().lower().replace(" ", "_") for c in self.df.columns]

        self.process_data()
        print("Data processing complete. Columns available:", self.df.columns.tolist())

    def process_data(self):
        self.df['complaint_date'] = pd.to_datetime(self.df['complaint_date'], errors='coerce')
        self.df = self.df.dropna(subset=['complaint_date'])

        self.df['run_hrs'] = pd.to_numeric(self.df['run_hrs'], errors='coerce').fillna(0)
        self.df['is_zhc'] = self.df['run_hrs'] < 24

        self.df['fy_year'] = self.df['complaint_date'].apply(
            lambda x: f"FY{str(x.year)[2:]}-{str(x.year+1)[2:]}" if x.month > 3
            else f"FY{str(x.year-1)[2:]}-{str(x.year)[2:]}"
        )

        self.df['month'] = self.df['complaint_date'].dt.month
        self.df['fy_month_idx'] = self.df['month'].apply(lambda x: x - 3 if x > 3 else x + 9)

        month_map = {1: 'Apr', 2: 'May', 3: 'Jun', 4: 'Jul', 5: 'Aug', 6: 'Sep',
                     7: 'Oct', 8: 'Nov', 9: 'Dec', 10: 'Jan', 11: 'Feb', 12: 'Mar'}
        self.df['fy_month_name'] = self.df['fy_month_idx'].map(month_map)

        def categorize(model):
            model_str = str(model).upper()
            match = re.search(r'\d+', model_str)
            if not match:
                return "Dual Stage"
            digit_str = match.group()
            return "Single Stage" if (digit_str == "12" or len(digit_str) == 1) else "Dual Stage"

        self.df['model_stage'] = self.df['model'].apply(categorize)

        if 'open_close' in self.df.columns:
            self.df['open_close'] = self.df['open_close'].astype(str).str.strip().str.capitalize()

    def get_overview_trends(self, selected_fy=None):
        yoy = self.df.groupby('fy_year').size().reset_index(name='count')

        fys = sorted(self.df['fy_year'].unique())

        if selected_fy and selected_fy in fys:
            curr_idx = fys.index(selected_fy)
            curr_fy = selected_fy
            prev_fy = fys[curr_idx - 1] if curr_idx > 0 else None
        else:
            curr_fy = fys[-1]
            prev_fy = fys[-2] if len(fys) > 1 else None

        compare_fys = [fy for fy in [curr_fy, prev_fy] if fy is not None]
        comp_df = self.df[self.df['fy_year'].isin(compare_fys)].copy()

        comp_df['quarter'] = comp_df['month'].apply(
            lambda x: 'Q1' if x in [4, 5, 6] else 'Q2' if x in [7, 8, 9] else 'Q3' if x in [10, 11, 12] else 'Q4'
        )

        monthly_stats = comp_df.groupby(['fy_month_name', 'fy_month_idx', 'fy_year']).size().reset_index(name='count')
        monthly_stats = monthly_stats.sort_values('fy_month_idx')

        quarterly_stats = comp_df.groupby(['quarter', 'fy_year']).size().reset_index(name='count')
        quarterly_stats = quarterly_stats.sort_values('quarter')

        current_scope_df = self.df[self.df['fy_year'] == curr_fy] if curr_fy else self.df
        single_stage = current_scope_df[current_scope_df['model_stage'] == "Single Stage"]['model'].value_counts().reset_index().head(10)
        dual_stage = current_scope_df[current_scope_df['model_stage'] == "Dual Stage"]['model'].value_counts().reset_index().head(10)

        return {
            "yoy": yoy.to_dict(orient="records"),
            "monthly": monthly_stats.to_dict(orient="records"),
            "quarterly": quarterly_stats.to_dict(orient="records"),
            "single_stage": single_stage.to_dict(orient="records"),
            "dual_stage": dual_stage.to_dict(orient="records"),
            "curr_fy": curr_fy,
            "prev_fy": prev_fy,
        }

    def get_kpi_stats(self, selected_fy=None):
        try:
            fys = sorted(self.df['fy_year'].unique())
            if not fys:
                return {"curr_fy": "N/A", "total_complaints": 0, "growth": 0, "open_complaints": 0, "zhc_count": 0, "zhc_rate": 0}

            curr_fy = selected_fy if selected_fy and selected_fy in fys else fys[-1]
            curr_idx = fys.index(curr_fy)
            prev_fy = fys[curr_idx - 1] if curr_idx > 0 else None

            curr_df = self.df[self.df['fy_year'] == curr_fy].copy()
            prev_df = self.df[self.df['fy_year'] == prev_fy].copy() if prev_fy else pd.DataFrame()

            curr_total = len(curr_df)
            prev_total = len(prev_df)

            growth = 0
            if prev_total > 0:
                growth = round(((curr_total - prev_total) / prev_total) * 100, 1)

            open_count = len(curr_df[curr_df['open_close'] == 'Open']) if 'open_close' in curr_df.columns else 0

            zhc_count = len(curr_df[curr_df['is_zhc'] == True])
            zhc_rate = round((zhc_count / curr_total * 100), 1) if curr_total > 0 else 0

            return {
                "curr_fy": curr_fy,
                "total_complaints": curr_total,
                "growth": growth,
                "open_complaints": open_count,
                "zhc_count": zhc_count,
                "zhc_rate": zhc_rate,
            }
        except Exception as e:
            print(f"Error in KPI calculation: {e}")
            return {"curr_fy": "Error", "total_complaints": 0, "growth": 0, "open_complaints": 0, "zhc_count": 0, "zhc_rate": 0}

    def get_complaints_page_data(self, selected_fy=None):
        fys = sorted(self.df['fy_year'].unique())
        curr_fy = selected_fy if selected_fy else fys[-1]

        df_filtered = self.df[self.df['fy_year'] == curr_fy].copy()

        if df_filtered.empty:
            return {
                "kpis": {"unique_dealers": 0, "unique_customers": 0, "top_segment": "N/A", "avg_complaints_per_dealer": 0.0},
                "charts": {"dealer": [], "customer": [], "app_stage": [], "issue_stage": []},
            }

        has_dealer = 'dealer_name' in df_filtered.columns
        has_customer = 'customer_name' in df_filtered.columns
        has_segment = 'application_market_segment' in df_filtered.columns
        has_stage = 'model_stage' in df_filtered.columns
        has_issue = 'nature_of_complaint' in df_filtered.columns

        dealer_data = df_filtered['dealer_name'].dropna().value_counts().reset_index().head(15) if has_dealer else pd.DataFrame(columns=['dealer_name', 'count'])
        customer_data = df_filtered['customer_name'].dropna().value_counts().reset_index().head(15) if has_customer else pd.DataFrame(columns=['customer_name', 'count'])

        if has_segment and has_stage:
            app_stage = df_filtered.dropna(subset=['application_market_segment', 'model_stage']).groupby(['application_market_segment', 'model_stage']).size().reset_index(name='count')
        else:
            app_stage = pd.DataFrame(columns=['application_market_segment', 'model_stage', 'count'])

        if has_issue and has_stage:
            tmp_issue = df_filtered.dropna(subset=['nature_of_complaint', 'model_stage'])
            issue_stage = tmp_issue.groupby(['nature_of_complaint', 'model_stage']).size().reset_index(name='count')
            top_issues = tmp_issue['nature_of_complaint'].value_counts().nlargest(15).index
            issue_stage = issue_stage[issue_stage['nature_of_complaint'].isin(top_issues)]
        else:
            issue_stage = pd.DataFrame(columns=['nature_of_complaint', 'model_stage', 'count'])

        unique_dealers = df_filtered['dealer_name'].nunique() if has_dealer else 0
        unique_customers = df_filtered['customer_name'].nunique() if has_customer else 0

        if has_segment and not df_filtered['application_market_segment'].dropna().empty:
            top_segment = df_filtered['application_market_segment'].mode()[0]
        else:
            top_segment = "N/A"

        avg_per_dealer = round(len(df_filtered) / unique_dealers, 1) if has_dealer and unique_dealers > 0 else 0.0

        return {
            "kpis": {
                "unique_dealers": unique_dealers,
                "unique_customers": unique_customers,
                "top_segment": top_segment,
                "avg_complaints_per_dealer": avg_per_dealer,
            },
            "charts": {
                "dealer": dealer_data.to_dict(orient="records"),
                "customer": customer_data.to_dict(orient="records"),
                "app_stage": app_stage.to_dict(orient="records"),
                "issue_stage": issue_stage.to_dict(orient="records"),
            },
        }


    def get_zhc_page_data(self, selected_fy=None):
        fys = sorted(self.df['fy_year'].unique())
        curr_fy = selected_fy if selected_fy and selected_fy in fys else fys[-1]
        curr_idx = fys.index(curr_fy)
        prev_fy = fys[curr_idx - 1] if curr_idx > 0 else None

        df_fy = self.df[self.df['fy_year'] == curr_fy].copy()
        zhc_df = df_fy[df_fy['is_zhc'] == True].copy()

        total_complaints = len(df_fy)
        total_zhc = len(zhc_df)
        zhc_rate = round((total_zhc / total_complaints * 100), 1) if total_complaints > 0 else 0

        primary_part = "N/A"
        if 'spares_parts_replaced' in zhc_df.columns and not zhc_df['spares_parts_replaced'].dropna().empty:
            primary_part = zhc_df['spares_parts_replaced'].mode()[0]

        zhc_growth = 0.0
        if prev_fy:
            prev_zhc = len(self.df[(self.df['fy_year'] == prev_fy) & (self.df['is_zhc'] == True)])
            if prev_zhc > 0:
                zhc_growth = round(((total_zhc - prev_zhc) / prev_zhc) * 100, 1)

        # Pareto: nature_of_complaint for ZHC subset
        pareto_data = []
        if 'nature_of_complaint' in zhc_df.columns and not zhc_df['nature_of_complaint'].dropna().empty:
            noc = zhc_df['nature_of_complaint'].dropna().value_counts().reset_index()
            noc.columns = ['nature_of_complaint', 'count']
            noc = noc.sort_values('count', ascending=False)
            total_noc = noc['count'].sum()
            noc['cumulative_pct'] = (noc['count'].cumsum() / total_noc * 100).round(1)
            pareto_data = noc.to_dict(orient="records")

        # ZHC by model
        zhc_by_model = []
        if 'model' in zhc_df.columns and not zhc_df['model'].dropna().empty:
            model_counts = zhc_df['model'].value_counts().reset_index()
            model_counts.columns = ['model', 'count']
            zhc_by_model = model_counts.to_dict(orient="records")

        # Top 10 parts replaced in ZHC
        top_parts = []
        if 'spares_parts_replaced' in zhc_df.columns and not zhc_df['spares_parts_replaced'].dropna().empty:
            parts = zhc_df['spares_parts_replaced'].dropna().value_counts().head(10).reset_index()
            parts.columns = ['part', 'count']
            top_parts = parts.to_dict(orient="records")

        return {
            "kpis": {
                "total_zhc": total_zhc,
                "zhc_rate": zhc_rate,
                "primary_failure_part": primary_part,
                "zhc_growth": zhc_growth,
            },
            "charts": {
                "pareto": pareto_data,
                "zhc_by_model": zhc_by_model,
                "top_parts": top_parts,
            },
        }

    def get_usage_page_data(self, selected_fy=None):
        import numpy as np

        fys = sorted(self.df['fy_year'].unique())
        curr_fy = selected_fy if selected_fy and selected_fy in fys else fys[-1]

        df_fy = self.df[self.df['fy_year'] == curr_fy].copy()

        run_hrs = df_fy['run_hrs'].dropna()
        mttf = round(float(run_hrs.mean()), 1) if len(run_hrs) > 0 else 0.0

        avg_age = 0.0
        if 'period_dd_to_dc_in_months' in df_fy.columns:
            age_vals = pd.to_numeric(df_fy['period_dd_to_dc_in_months'], errors='coerce').dropna()
            avg_age = round(float(age_vals.mean()), 1) if len(age_vals) > 0 else 0.0

        high_usage = int((run_hrs > 5000).sum())

        dominant_segment = "N/A"
        if 'application_market_segment' in df_fy.columns and not df_fy['application_market_segment'].dropna().empty:
            seg_avg = df_fy.groupby('application_market_segment')['run_hrs'].mean()
            dominant_segment = str(seg_avg.idxmax())

        # Failure distribution histogram bins
        bins = [0, 24, 100, 500, 1000, 2000, 5000, 10000, 50000]
        bin_labels = ['0-24', '25-100', '101-500', '501-1K', '1K-2K', '2K-5K', '5K-10K', '10K+']
        hist_counts, _ = np.histogram(run_hrs.values, bins=bins)
        failure_distribution = [{"bin": lbl, "count": int(c)} for lbl, c in zip(bin_labels, hist_counts)]

        # Application vs usage (box plot data per segment)
        app_vs_usage = []
        if 'application_market_segment' in df_fy.columns:
            for seg, grp in df_fy.dropna(subset=['application_market_segment']).groupby('application_market_segment'):
                vals = grp['run_hrs'].dropna()
                if len(vals) == 0:
                    continue
                app_vs_usage.append({
                    "segment": str(seg),
                    "values": vals.tolist(),
                })

        # Time to failure trend (scatter)
        time_to_failure = []
        if 'period_dd_to_dc_in_months' in df_fy.columns:
            scatter_df = df_fy[['complaint_date', 'period_dd_to_dc_in_months']].dropna()
            scatter_df['period_dd_to_dc_in_months'] = pd.to_numeric(scatter_df['period_dd_to_dc_in_months'], errors='coerce')
            scatter_df = scatter_df.dropna()
            time_to_failure = [
                {"date": d.strftime('%Y-%m-%d'), "months": float(m)}
                for d, m in zip(scatter_df['complaint_date'], scatter_df['period_dd_to_dc_in_months'])
            ]

        # RPM vs nature of complaint heatmap
        rpm_heatmap = {"rpm_bins": [], "complaints": [], "matrix": []}
        if 'rpm' in df_fy.columns and 'nature_of_complaint' in df_fy.columns:
            hm_df = df_fy[['rpm', 'nature_of_complaint']].dropna().copy()
            hm_df['rpm'] = pd.to_numeric(hm_df['rpm'], errors='coerce')
            hm_df = hm_df.dropna()
            if len(hm_df) > 0:
                rpm_bins = [0, 500, 1000, 1500, 2000, 3000, 5000]
                rpm_labels = ['0-500', '501-1000', '1001-1500', '1501-2000', '2001-3000', '3000+']
                hm_df['rpm_bin'] = pd.cut(hm_df['rpm'], bins=rpm_bins, labels=rpm_labels, include_lowest=True)
                top_complaints = hm_df['nature_of_complaint'].value_counts().head(10).index.tolist()
                hm_df = hm_df[hm_df['nature_of_complaint'].isin(top_complaints)]
                ct = pd.crosstab(hm_df['nature_of_complaint'], hm_df['rpm_bin'])
                rpm_heatmap = {
                    "rpm_bins": [str(c) for c in ct.columns.tolist()],
                    "complaints": ct.index.tolist(),
                    "matrix": ct.values.tolist(),
                }

        return {
            "kpis": {
                "mttf": mttf,
                "avg_age_at_failure": avg_age,
                "high_usage_failures": high_usage,
                "dominant_segment": dominant_segment,
            },
            "charts": {
                "failure_distribution": failure_distribution,
                "app_vs_usage": app_vs_usage,
                "time_to_failure": time_to_failure,
                "rpm_heatmap": rpm_heatmap,
            },
        }


engine = WarrantyDataEngine("Warranty_Claims_Cleaned_MasterDataset.xlsx")
