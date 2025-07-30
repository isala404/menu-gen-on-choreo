const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface MenuStatus {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  items: MenuItem[];
  created_at: string;
  error?: string;
}

export interface MenuItem {
  id: string;
  item_text: string;
  item_price: string;
  description?: string;
  estimated_calories?: number;
  generated_image_data?: string; // base64 encoded image
  created_at: string;
}

export interface UploadResponse {
  menu_id: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async uploadMenu(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${this.baseUrl}/api/menus`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    return response.json();
  }

  async getMenuStatus(menuId: string): Promise<MenuStatus> {
    const response = await fetch(`${this.baseUrl}/api/menus/${menuId}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch menu: ${errorText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
