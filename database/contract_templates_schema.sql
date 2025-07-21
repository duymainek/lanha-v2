-- Create contract_templates table
CREATE TABLE IF NOT EXISTS contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    fields JSONB NOT NULL DEFAULT '[]',
    file_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_contract_templates_name ON contract_templates(name);
CREATE INDEX IF NOT EXISTS idx_contract_templates_is_active ON contract_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_contract_templates_created_at ON contract_templates(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON contract_templates
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON contract_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON contract_templates
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON contract_templates
    FOR DELETE USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE
    ON contract_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default template
INSERT INTO contract_templates (name, description, content, fields) VALUES (
    'Hợp đồng thuê nhà cơ bản',
    'Template mặc định cho hợp đồng thuê nhà',
    '<h1>HỢP ĐỒNG THUÊ NHÀ</h1>
    <p>Bên A (Chủ nhà): <strong>Admin</strong></p>
    <p>Bên B (Người thuê): <strong>{tenant_name}</strong></p>
    <p>CCCD: <strong>{tenant_id_number}</strong></p>
    <p>Điện thoại: <strong>{tenant_phone}</strong></p>
    
    <h2>THÔNG TIN PHÒNG</h2>
    <p>Tòa nhà: <strong>{building_name}</strong></p>
    <p>Phòng số: <strong>{room_number}</strong></p>
    <p>Diện tích: <strong>{room_area} m²</strong></p>
    <p>Địa chỉ: <strong>{building_address}</strong></p>
    
    <h2>ĐIỀU KHOẢN TÀI CHÍNH</h2>
    <p>Giá thuê: <strong>{rent_price} VNĐ/tháng</strong></p>
    <p>Tiền cọc: <strong>{deposit_amount} VNĐ</strong></p>
    <p>Giá điện: <strong>{electricity_price} VNĐ/kWh</strong></p>
    <p>Giá nước: <strong>{water_price} VNĐ/khối</strong></p>
    
    <h2>THỜI HẠN</h2>
    <p>Ngày bắt đầu: <strong>{start_date}</strong></p>
    <p>Ngày kết thúc: <strong>{end_date}</strong></p>
    <p>Thời hạn thuê: <strong>{rental_period} tháng</strong></p>
    
    <div style="margin-top: 50px;">
        <div style="display: flex; justify-content: space-between;">
            <div style="text-align: center;">
                <p><strong>Chủ nhà</strong></p>
                <p style="margin-top: 60px;">________________</p>
            </div>
            <div style="text-align: center;">
                <p><strong>Người thuê</strong></p>
                <p style="margin-top: 60px;">________________</p>
            </div>
        </div>
    </div>',
    '[
        {"name": "tenant_name", "label": "Tên người thuê", "type": "text", "required": true},
        {"name": "tenant_id_number", "label": "Số CCCD", "type": "text", "required": true},
        {"name": "tenant_phone", "label": "Số điện thoại", "type": "text", "required": true},
        {"name": "building_name", "label": "Tên tòa nhà", "type": "text", "required": true},
        {"name": "room_number", "label": "Số phòng", "type": "text", "required": true},
        {"name": "room_area", "label": "Diện tích phòng", "type": "number", "required": true},
        {"name": "building_address", "label": "Địa chỉ tòa nhà", "type": "text", "required": true},
        {"name": "rent_price", "label": "Giá thuê", "type": "number", "required": true},
        {"name": "deposit_amount", "label": "Tiền cọc", "type": "number", "required": true},
        {"name": "electricity_price", "label": "Giá điện", "type": "number", "required": true},
        {"name": "water_price", "label": "Giá nước", "type": "number", "required": true},
        {"name": "start_date", "label": "Ngày bắt đầu", "type": "date", "required": true},
        {"name": "end_date", "label": "Ngày kết thúc", "type": "date", "required": true},
        {"name": "rental_period", "label": "Thời hạn thuê (tháng)", "type": "number", "required": true}
    ]'::jsonb
) ON CONFLICT DO NOTHING; 