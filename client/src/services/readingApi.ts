import { apiClient, getApiErrorMessage } from './api';
import { ApiResponse, Reading, TimeSlot } from '@/types';

export interface ReadingFilters {
  date?: string;
  month?: string;
  timeSlot?: TimeSlot;
}

export interface CreateReadingDto {
  readingDate: string;
  timeSlot: TimeSlot;
  glucoseValue: number;
}

export interface UpdateReadingDto {
  readingDate?: string;
  timeSlot?: TimeSlot;
  glucoseValue?: number;
}

export const readingApi = {
  /**
   * Retrieves readings for the authenticated user with optional filtering
   */
  async getReadings(filters?: ReadingFilters): Promise<Reading[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ readings: Reading[] }>>('/readings', {
        params: filters,
      });
      return response.data.data?.readings || [];
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  /**
   * Retrieves a single reading by ID
   */
  async getReadingById(id: string): Promise<Reading> {
    try {
      const response = await apiClient.get<ApiResponse<{ reading: Reading }>>(`/readings/${id}`);
      if (!response.data.data?.reading) {
        throw new Error('Reading not found');
      }
      return response.data.data.reading;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  /**
   * Records a new blood glucose reading
   */
  async createReading(data: CreateReadingDto): Promise<Reading> {
    try {
      const response = await apiClient.post<ApiResponse<{ reading: Reading }>>('/readings', data);
      if (!response.data.data?.reading) {
        throw new Error(response.data.message || 'Failed to record reading');
      }
      return response.data.data.reading;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  /**
   * Updates an existing blood glucose reading
   */
  async updateReading(id: string, data: UpdateReadingDto): Promise<Reading> {
    try {
      const response = await apiClient.put<ApiResponse<{ reading: Reading }>>(`/readings/${id}`, data);
      if (!response.data.data?.reading) {
        throw new Error(response.data.message || 'Failed to update reading');
      }
      return response.data.data.reading;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  /**
   * Deletes a blood glucose reading
   */
  async deleteReading(id: string): Promise<void> {
    try {
      await apiClient.delete(`/readings/${id}`);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },
};
