// @ts-expect-error - No type definitions available for html2pdf.js
import html2pdf from 'html2pdf.js'
import { PDFDocument, rgb } from 'pdf-lib'
import type { SupabaseContractTemplate, Contract } from '@/data/types'
import { ContractService } from './ContractService'

interface PDFOptions {
  margin?: number[]
  filename?: string
  image?: { type: string; quality: number }
  html2canvas?: Record<string, unknown>
  jsPDF?: Record<string, unknown>
  pagebreak?: { mode: string[] }
}

export class PDFService {
  
  /**
   * Convert HTML content to PDF buffer
   * @param htmlContent - HTML string to convert
   * @param options - PDF generation options
   * @returns PDF as ArrayBuffer
   */
  static async htmlToPDF(htmlContent: string, options: PDFOptions = {}): Promise<ArrayBuffer> {
    const defaultOptions = {
      margin: [20, 20, 20, 20], // top, right, bottom, left in mm
      filename: 'contract.pdf',
      image: { type: 'jpeg', quality: 0.92 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    }

    const finalOptions = { ...defaultOptions, ...options }
    
    // Create a temporary container for the content
    const tempContainer = document.createElement('div')
    tempContainer.innerHTML = htmlContent
    tempContainer.style.width = '210mm' // A4 width
    tempContainer.style.minHeight = '297mm' // A4 height
    tempContainer.style.padding = '20mm'
    tempContainer.style.fontFamily = 'Arial, sans-serif'
    tempContainer.style.fontSize = '12px'
    tempContainer.style.lineHeight = '1.6'
    tempContainer.style.color = '#000000'
    tempContainer.style.backgroundColor = '#ffffff'
    
    // Temporarily add to DOM for rendering
    document.body.appendChild(tempContainer)
    
    try {
      const pdfBlob = await html2pdf()
        .set(finalOptions)
        .from(tempContainer)
        .outputPdf('arraybuffer')
      
      return pdfBlob
    } finally {
      // Clean up
      document.body.removeChild(tempContainer)
    }
  }

  /**
   * Generate contract PDF from template and data
   * @param template - Contract template
   * @param contractData - Contract data to fill
   * @returns PDF as ArrayBuffer
   */
  static async generateContractPDF(
    template: SupabaseContractTemplate, 
    contractData: Record<string, string | number | boolean | Date | null>
  ): Promise<ArrayBuffer> {
    const filledContent = ContractService.fillTemplate(template, contractData)
    
    // Add PDF-specific styling
    const styledContent = `
      <div style="
        font-family: 'Times New Roman', serif;
        font-size: 14px;
        line-height: 1.8;
        color: #000000;
        max-width: 100%;
        margin: 0;
        padding: 0;
      ">
        ${filledContent}
        
        <!-- Signature placeholders -->
        <div style="margin-top: 60px; display: flex; justify-content: space-between;">
          <div style="text-align: center; width: 45%;">
            <div style="margin-bottom: 80px; border-bottom: 1px solid #000; width: 200px;"></div>
            <p><strong>Bên cho thuê</strong></p>
            <p>(Ký và ghi rõ họ tên)</p>
          </div>
          <div style="text-align: center; width: 45%;">
            <div style="margin-bottom: 80px; border-bottom: 1px solid #000; width: 200px;" id="tenant-signature-area"></div>
            <p><strong>Bên thuê</strong></p>
            <p>(Ký và ghi rõ họ tên)</p>
          </div>
        </div>
      </div>
    `

    return this.htmlToPDF(styledContent, {
      filename: `contract_${Date.now()}.pdf`,
      margin: [15, 15, 15, 15]
    })
  }

  /**
   * Insert signature into existing PDF
   * @param pdfBuffer - Original PDF as ArrayBuffer
   * @param signatureBase64 - Signature image as base64 string
   * @param position - Position to insert signature
   * @returns Modified PDF as ArrayBuffer
   */
  static async insertSignatureIntoPDF(
    pdfBuffer: ArrayBuffer, 
    signatureBase64: string, 
    options: {
      x?: number
      y?: number
      width?: number
      height?: number
      page?: number
    } = {}
  ): Promise<ArrayBuffer> {
    const {
      x = 400, // X position from left
      y = 120, // Y position from bottom
      width = 120,
      height = 60,
      page = -1 // Last page by default
    } = options

    try {
      // Load the existing PDF
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      
      // Get the page (last page by default)
      const pages = pdfDoc.getPages()
      const targetPage = page === -1 ? pages[pages.length - 1] : pages[page]
      
      if (!targetPage) {
        throw new Error('Invalid page number')
      }

      // Remove "data:image/png;base64," prefix if present
      const base64Data = signatureBase64.replace(/^data:image\/[a-z]+;base64,/, '')
      
      // Embed the signature image
      let signatureImage
      try {
        // Try PNG first
        signatureImage = await pdfDoc.embedPng(base64Data)
      } catch {
        try {
          // Fallback to JPEG
          signatureImage = await pdfDoc.embedJpg(base64Data)
        } catch (err) {
          console.error('Failed to embed signature image:', err)
          throw new Error('Unsupported signature image format')
        }
      }

      // Draw the signature on the page
      targetPage.drawImage(signatureImage, {
        x,
        y,
        width,
        height,
        opacity: 1,
      })

      // Add signature timestamp
      const now = new Date()
      const timestamp = now.toLocaleString('vi-VN')
      targetPage.drawText(`Ký ngày: ${timestamp}`, {
        x,
        y: y - 20,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
      })

      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save()
      return modifiedPdfBytes.buffer
      
    } catch (error) {
      console.error('Error inserting signature into PDF:', error)
      throw new Error(`Failed to insert signature: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate complete signed contract PDF
   * @param contract - Contract data
   * @param signatureBase64 - Tenant signature
   * @returns Signed PDF as ArrayBuffer
   */
  static async generateSignedContractPDF(
    contract: Contract, 
    signatureBase64: string
  ): Promise<ArrayBuffer> {
    if (!contract.template) {
      throw new Error('Contract template is required')
    }

    try {
      // Generate base PDF from template
      const basePDF = await this.generateContractPDF(contract.template, contract.contract_data)
      
      // Insert tenant signature
      const signedPDF = await this.insertSignatureIntoPDF(basePDF, signatureBase64, {
        x: 420, // Right side for tenant signature
        y: 120, // From bottom
        width: 120,
        height: 60
      })

      return signedPDF
      
    } catch (error) {
      console.error('Error generating signed contract PDF:', error)
      throw new Error(`Failed to generate signed contract: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate complete signed contract PDF with both admin and tenant signatures
   * @param contract - Contract data with signatures
   * @returns Signed PDF as ArrayBuffer
   */
  static async generateSignedContractPDFWithBothSignatures(
    contract: Contract
  ): Promise<ArrayBuffer> {
    if (!contract.template) {
      throw new Error('Contract template is required')
    }

    if (contract.status !== 'signed' && contract.status !== 'completed') {
      throw new Error('Contract must be signed to generate PDF with signatures')
    }

    try {
      // Generate HTML content with signatures embedded
      const filledContent = await ContractService.fillTemplate(
        contract.template, 
        contract.contract_data,
        contract.tenant_sign_url // This will embed tenant signature in HTML
      )
      
      // Add PDF-specific styling with proper signature areas
      const styledContent = `
        <div style="
          font-family: 'Times New Roman', serif;
          font-size: 14px;
          line-height: 1.8;
          color: #000000;
          max-width: 100%;
          margin: 0;
          padding: 0;
        ">
          ${filledContent}
        </div>
      `

      // Generate PDF with embedded signatures
      const pdfBuffer = await this.htmlToPDF(styledContent, {
        filename: `contract_signed_${contract.tenant?.full_name}_${Date.now()}.pdf`,
        margin: [15, 15, 15, 15],
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          allowTaint: true,
          logging: false
        }
      })

      return pdfBuffer
      
    } catch (error) {
      console.error('Error generating signed contract PDF:', error)
      throw new Error(`Failed to generate signed contract: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Download PDF to user's device
   * @param pdfBuffer - PDF as ArrayBuffer
   * @param filename - Filename for download
   */
  static downloadPDF(pdfBuffer: ArrayBuffer, filename: string = 'contract.pdf'): void {
    try {
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      throw new Error('Failed to download PDF')
    }
  }

  /**
   * Convert ArrayBuffer to base64 string
   * @param buffer - ArrayBuffer to convert
   * @returns Base64 string
   */
  static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Convert base64 string to ArrayBuffer
   * @param base64 - Base64 string to convert
   * @returns ArrayBuffer
   */
  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }
} 