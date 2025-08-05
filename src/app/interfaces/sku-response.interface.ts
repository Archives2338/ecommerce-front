export interface SkuPlan {
  month_id: number;
  month: number;
  month_content: string;
  screen_id: number;
  max_user: number;
  substitute_recharge: number;
  screen: number;
  screen_content: string;
  seat_type: string;
  type_plan_id: number;
  sort: number;
  currency_icon1: string;
  currency_icon2: string;
  currency_show_type: number;
  original_price: string;
  sale_price: string;
  average_price: string;
  discount: string;
}

export interface MonthOption {
  month_id: number;
  month: number;
  month_content: string;
  screen: SkuPlan[];
}

export interface ScreenOption {
  screen_id: number;
  max_user: number;
  substitute_recharge: number;
  screen: number;
  screen_content: string;
  seat_type: string;
  sort: number;
  month: SkuPlan[];
}

export interface PlanData {
  month: MonthOption[];
  screen: ScreenOption[];
  default_month_id: number;
  default_screen_id: number;
}

export interface SkuData {
  id: number;
  show_status: number;
  type_name: string;
  thumb_img: string;
  selectInfo: string;
  sku_style_status: boolean;
  plan: PlanData;
  repayment: PlanData;
  _id: string;
}

export interface SkuResponse {
  code: number;
  message: string;
  toast: number;
  redirect_url: string;
  type: string;
  data: SkuData;
}
