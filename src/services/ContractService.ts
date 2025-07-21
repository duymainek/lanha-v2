import { supabase } from '../supabaseClient';
import type { 
  Contract, 
  SupabaseContract, 
  SupabaseContractTemplate, 
  ContractFormData,
  ContractTemplateField,
  SupabaseTenant,
  SupabaseApartmentRaw,
  SupabaseBuilding
} from '../data/types';

export class ContractService {
  
  static async createContract(formData: ContractFormData): Promise<SupabaseContract> {
    const { data, error } = await supabase
      .from('contracts')
      .insert(formData)
      .select('*')
      .single();
    
    if (error) throw new Error(`Failed to create contract: ${error.message}`);
    return data;
  }

  static async getContractById(contractId: string): Promise<Contract | null> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        tenant:tenant_id (*),
        apartment:apartment_id (
          *,
          buildings:building_id (*)
        ),
        template:template_id (*)
      `)
      .eq('id', contractId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch contract: ${error.message}`);
    }
    
    return {
      ...data,
      building: data.apartment?.buildings || null
    };
  }

  static async getContractByShareToken(shareToken: string): Promise<Contract | null> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        tenant:tenant_id (*),
        apartment:apartment_id (
          *,
          buildings:building_id (*)
        ),
        template:template_id (*)
      `)
      .eq('share_token', shareToken)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch contract: ${error.message}`);
    }
    
    return {
      ...data,
      building: data.apartment?.buildings || null
    };
  }

  static async getAllContracts(): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        tenant:tenant_id (*),
        apartment:apartment_id (
          *,
          buildings:building_id (*)
        ),
        template:template_id (*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch contracts: ${error.message}`);
    
    return (data || []).map(contract => ({
      ...contract,
      building: contract.apartment?.buildings || null
    }));
  }

  static async updateContract(contractId: string, updates: Partial<SupabaseContract>): Promise<SupabaseContract> {
    const { data, error } = await supabase
      .from('contracts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', contractId)
      .select('*')
      .single();
    
    if (error) throw new Error(`Failed to update contract: ${error.message}`);
    return data;
  }

  static async updateContractStatus(contractId: string, status: SupabaseContract['status']): Promise<SupabaseContract> {
    return this.updateContract(contractId, { status });
  }

  static async saveSignature(contractId: string, signatureData: string): Promise<SupabaseContract> {
    // Get full contract data first
    const contract = await this.getContractById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    // Upload signature to storage
    const signatureBlob = this.dataURLToBlob(signatureData);
    const signaturePath = `contracts/${contractId}/tenant_signature.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('signatures')
      .upload(signaturePath, signatureBlob, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw new Error(`Failed to upload signature: ${uploadError.message}`);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('signatures')
      .getPublicUrl(uploadData.path);

    // Update contract with signature URL and status
    const updates = {
      tenant_sign_url: urlData.publicUrl,
      signature_data: signatureData, // Keep for backup
      signed_at: new Date().toISOString(),
      status: 'signed' as const
    };
    
    return this.updateContract(contractId, updates);
  }

  static async deleteContract(contractId: string): Promise<void> {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', contractId);
    
    if (error) throw new Error(`Failed to delete contract: ${error.message}`);
  }

  static generateFilePath(building: SupabaseBuilding, apartment: SupabaseApartmentRaw, tenant: SupabaseTenant, fileExtension: string = 'pdf'): string {
    const buildingName = building.name.replace(/[^a-zA-Z0-9]/g, '_');
    const unitNumber = apartment.unit_number.replace(/[^a-zA-Z0-9]/g, '_');
    const tenantName = tenant.full_name.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    
    return `contracts/${buildingName}/${unitNumber}/${tenantName}/contract_${timestamp}.${fileExtension}`;
  }

  static generateShareLink(shareToken: string): string {
    return `${window.location.origin}/contract-sign/${shareToken}`;
  }

  static async fillTemplate(
    template: SupabaseContractTemplate, 
    contractData: Record<string, string | number | boolean | Date | null>,
    tenantSignatureUrl?: string | null
  ): Promise<string> {
    let filledContent = template.content;
    
    // Fill regular template fields
    template.fields.forEach(field => {
      const value = contractData[field.name];
      const placeholder = `{${field.name}}`;
      const displayValue = this.formatFieldValue(value, field);
      
      filledContent = filledContent.replace(new RegExp(placeholder, 'g'), displayValue);
    });
    
    // Fill signature placeholders
    const { AdminSignatureService } = await import('./AdminSignatureService');
    
    // Admin signature
    const adminSignatureUrl = await AdminSignatureService.getAdminSignatureUrl();
    if (adminSignatureUrl) {
      const adminSignatureImg = `<img src="${adminSignatureUrl}" alt="Admin Signature" style="width: 400px; " />`;
      filledContent = filledContent.replace(/{admin_signature}/g, adminSignatureImg);
    } else {
      filledContent = filledContent.replace(/{admin_signature}/g, '________________');
    }
    
    // Tenant signature
    if (tenantSignatureUrl) {
      const tenantSignatureImg = `<img src="${tenantSignatureUrl}" alt="Tenant Signature" style="width: 400px;" />`;
      filledContent = filledContent.replace(/{tenant_signature}/g, tenantSignatureImg);
    } else {
      filledContent = filledContent.replace(/{tenant_signature}/g, '________________');
    }
    
    return filledContent;
  }

  static formatFieldValue(value: string | number | boolean | Date | null, field: ContractTemplateField): string {
    if (value === null || value === undefined) return '';
    
    switch (field.type) {
      case 'date':
        if (value instanceof Date) {
          return value.toLocaleDateString('vi-VN');
        }
        if (typeof value === 'string') {
          return new Date(value).toLocaleDateString('vi-VN');
        }
        return String(value);
      
      case 'number':
        if (typeof value === 'number') {
          return value.toLocaleString('vi-VN');
        }
        return String(value);
      
      default:
        return String(value);
    }
  }

  static async uploadFile(file: File, filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('contracts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw new Error(`Failed to upload file: ${error.message}`);
    
    const { data: urlData } = supabase.storage
      .from('contracts')
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  }

  static async deleteFile(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from('contracts')
      .remove([filePath]);
    
    if (error) throw new Error(`Failed to delete file: ${error.message}`);
  }

  static dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type: mime});
  }

  /**
   * Download signed contract as PDF
   */
  static async downloadSignedContract(contract: Contract): Promise<void> {
    if (contract.status !== 'signed' && contract.status !== 'completed') {
      throw new Error('Only signed or completed contracts can be downloaded with signatures');
    }

    const { PDFService } = await import('./PDFService');
    
    try {
      // Generate PDF with both signatures
      const pdfBuffer = await PDFService.generateSignedContractPDFWithBothSignatures(contract);
      
      // Generate filename
      const tenantName = contract.tenant?.full_name || 'Unknown';
      const unitNumber = contract.apartment?.unit_number || 'Unknown';
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Contract_${tenantName.replace(/[^a-zA-Z0-9]/g, '_')}_${unitNumber}_${timestamp}.pdf`;
      
      // Download the file
      PDFService.downloadPDF(pdfBuffer, filename);
      
    } catch (error) {
      console.error('Error downloading signed contract:', error);
      throw new Error(`Failed to download contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 