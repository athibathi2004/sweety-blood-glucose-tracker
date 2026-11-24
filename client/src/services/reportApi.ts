import { apiClient, getApiErrorMessage } from './api';
import { ApiResponse, DailyReport, MonthToDateReport, PreviousMonthReport } from '@/types';

export const reportApi = {
  /**
   * Retrieves the Daily Report for a single calendar date
   */
  async getDailyReport(date: string): Promise<DailyReport> {
    try {
      const response = await apiClient.get<ApiResponse<DailyReport>>('/reports/daily', {
        params: { date },
      });
      if (!response.data.data) {
        throw new Error('No data received from daily report');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  /**
   * Retrieves the Month-to-Date Report from the 1st of the month through selectedDate
   */
  async getMonthToDateReport(date: string): Promise<MonthToDateReport> {
    try {
      const response = await apiClient.get<ApiResponse<MonthToDateReport>>('/reports/month-to-date', {
        params: { date },
      });
      if (!response.data.data) {
        throw new Error('No data received from month-to-date report');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  /**
   * Retrieves the Previous-Month Report for the entire calendar month preceding selectedDate
   */
  async getPreviousMonthReport(date: string): Promise<PreviousMonthReport> {
    try {
      const response = await apiClient.get<ApiResponse<PreviousMonthReport>>('/reports/monthly', {
        params: { date },
      });
      if (!response.data.data) {
        throw new Error('No data received from previous month report');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },
};
