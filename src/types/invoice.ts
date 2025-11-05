export interface LineItem {
  Description: string;
  Quantity: number;
  UnitAmount: number;
  AccountCode: string;
}

export interface ERPData {
  Type: 'ACCREC' | 'ACCPAY';
  Contact: { Name: string };
  Date: string;
  DueDate: string;
  LineItems: LineItem[];
  Status: string;
}

export interface CRMData {
  Name: string;
  EmailAddress: string;
}

export interface ExtractedInvoiceData {
  model: string;
  ERP: ERPData;
  CRM: CRMData;
}
