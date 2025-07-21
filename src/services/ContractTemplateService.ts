import { supabase } from '../supabaseClient';
import type { 
  SupabaseContractTemplate, 
  ContractTemplateField 
} from '../data/types';

export class ContractTemplateService {
  
  static async createTemplate(templateData: Omit<SupabaseContractTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseContractTemplate> {
    const { data, error } = await supabase
      .from('contract_templates')
      .insert(templateData)
      .select('*')
      .single();
    
    if (error) throw new Error(`Failed to create template: ${error.message}`);
    return data;
  }

  static async getTemplateById(templateId: string): Promise<SupabaseContractTemplate | null> {
    const { data, error } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch template: ${error.message}`);
    }
    
    return data;
  }

  static async getAllTemplates(activeOnly: boolean = false): Promise<SupabaseContractTemplate[]> {
    let query = supabase
      .from('contract_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;
    
    if (error) throw new Error(`Failed to fetch templates: ${error.message}`);
    return data || [];
  }

  static async updateTemplate(templateId: string, updates: Partial<SupabaseContractTemplate>): Promise<SupabaseContractTemplate> {
    const { data, error } = await supabase
      .from('contract_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', templateId)
      .select('*')
      .single();
    
    if (error) throw new Error(`Failed to update template: ${error.message}`);
    return data;
  }

  static async deleteTemplate(templateId: string): Promise<void> {
    const { error } = await supabase
      .from('contract_templates')
      .delete()
      .eq('id', templateId);
    
    if (error) throw new Error(`Failed to delete template: ${error.message}`);
  }

  static async toggleTemplateStatus(templateId: string, isActive: boolean): Promise<SupabaseContractTemplate> {
    return this.updateTemplate(templateId, { is_active: isActive });
  }

  static parseFieldsFromContent(content: string): ContractTemplateField[] {
    const fieldMatches = content.match(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g) || [];
    const uniqueFields = [...new Set(fieldMatches.map(match => match.slice(1, -1)))];
    
    return uniqueFields.map(fieldName => ({
      name: fieldName,
      label: this.generateFieldLabel(fieldName),
      type: this.guessFieldType(fieldName),
      required: true,
      placeholder: `Nhập ${this.generateFieldLabel(fieldName).toLowerCase()}`,
    }));
  }

  static generateFieldLabel(fieldName: string): string {
    const labelMap: Record<string, string> = {
      tenant_name: 'Tenant Name',
      tenant_id_number: 'ID Number',
      tenant_phone: 'Phone Number',
      tenant_email: 'Email',
      apartment_number: 'Unit Number',
      building_name: 'Building Name',
      building_address: 'Building Address',
      rent_price: 'Monthly Rent',
      deposit_amount: 'Security Deposit',
      electricity_price: 'Electricity Rate',
      water_price: 'Water Rate',
      lease_start_date: 'Lease Start Date',
      lease_end_date: 'Lease End Date',
      contract_date: 'Contract Date',
      rental_period: 'Rental Period',
    };
    
    return labelMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  static guessFieldType(fieldName: string): ContractTemplateField['type'] {
    if (fieldName.includes('date')) return 'date';
    if (fieldName.includes('price') || fieldName.includes('amount') || fieldName.includes('deposit')) return 'number';
    if (fieldName.includes('phone') || fieldName.includes('id_number')) return 'text';
    if (fieldName.includes('address') || fieldName.includes('note')) return 'textarea';
    
    return 'text';
  }

  static async uploadTemplateFile(file: File, templateId: string): Promise<string> {
    const fileExtension = file.name.split('.').pop() || 'file';
    const filePath = `template_${templateId}.${fileExtension}`;
    
    const { data, error } = await supabase.storage
      .from('contract-templates')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw new Error(`Failed to upload template file: ${error.message}`);
    
    const { data: urlData } = supabase.storage
      .from('contract-templates')
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  }

  static async deleteTemplateFile(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from('contract-templates')
      .remove([filePath]);
    
    if (error) throw new Error(`Failed to delete template file: ${error.message}`);
  }

  static validateTemplate(template: SupabaseContractTemplate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!template.name.trim()) {
      errors.push('Tên template không được để trống');
    }
    
    if (!template.content.trim()) {
      errors.push('Nội dung template không được để trống');
    }
    
    if (template.fields.length === 0) {
      errors.push('Template phải có ít nhất 1 field');
    }
    
    template.fields.forEach((field, index) => {
      if (!field.name.trim()) {
        errors.push(`Field thứ ${index + 1}: Tên field không được để trống`);
      }
      if (!field.label.trim()) {
        errors.push(`Field thứ ${index + 1}: Label không được để trống`);
      }
    });
    
    const fieldsInContent = this.parseFieldsFromContent(template.content);
    const templateFieldNames = template.fields.map(f => f.name);
    const missingFields = fieldsInContent
      .map(f => f.name)
      .filter(name => !templateFieldNames.includes(name));
    
    if (missingFields.length > 0) {
      errors.push(`Template thiếu định nghĩa cho các field: ${missingFields.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static createSampleTemplate(): Omit<SupabaseContractTemplate, 'id' | 'created_at' | 'updated_at'> {
    const content = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px;">
  <h1 style="text-align: center; margin-bottom: 30px;">HỢP ĐỒNG THUÊ NHÀ</h1>
  
  <p><strong>Bên cho thuê:</strong> {landlord_name}</p>
  <p><strong>Địa chỉ:</strong> {landlord_address}</p>
  <p><strong>Điện thoại:</strong> {landlord_phone}</p>
  
  <p><strong>Bên thuê:</strong> {tenant_name}</p>
  <p><strong>CMND/CCCD:</strong> {tenant_id_number}</p>
  <p><strong>Điện thoại:</strong> {tenant_phone}</p>
  
  <h3>Thông tin phòng thuê:</h3>
  <p><strong>Địa chỉ:</strong> {building_address}</p>
  <p><strong>Tòa nhà:</strong> {building_name}</p>
  <p><strong>Số phòng:</strong> {apartment_number}</p>
  
  <h3>Thông tin hợp đồng:</h3>
  <p><strong>Giá thuê:</strong> {rent_price} VNĐ/tháng</p>
  <p><strong>Tiền cọc:</strong> {deposit_amount} VNĐ</p>
  <p><strong>Giá điện:</strong> {electricity_price} VNĐ/kWh</p>
  <p><strong>Giá nước:</strong> {water_price} VNĐ/m³</p>
  <p><strong>Thời hạn thuê:</strong> {rental_period} tháng</p>
  <p><strong>Ngày bắt đầu:</strong> {lease_start_date}</p>
  <p><strong>Ngày kết thúc:</strong> {lease_end_date}</p>
  
  <div style="margin-top: 50px;">
    <p><strong>Ngày ký hợp đồng:</strong> {contract_date}</p>
  </div>
  
  <div style="display: flex; justify-content: space-between; margin-top: 50px;">
    <div style="text-align: center;">
      <p><strong>Bên cho thuê</strong></p>
      <p>(Ký tên)</p>
    </div>
    <div style="text-align: center;">
      <p><strong>Bên thuê</strong></p>
      <p>(Ký tên)</p>
    </div>
  </div>
</div>
    `.trim();
    
    const fields: ContractTemplateField[] = this.parseFieldsFromContent(content);
    
    return {
      name: 'Hợp đồng thuê nhà cơ bản',
      description: 'Template mẫu cho hợp đồng thuê nhà với đầy đủ thông tin cần thiết',
      content,
      fields,
      file_url: null,
      is_active: true
    };
  }
} 