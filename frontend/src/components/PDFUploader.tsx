import { Box, Button, useToast } from '@chakra-ui/react'
import { useCallback } from 'react'
import { Document } from '../types'
import { uploadPDF, saveDocumentMetadata, supabase } from '../config/supabase'

interface PDFUploaderProps {
  onDocumentUpload: (document: Document) => void
}

const PDFUploader = ({ onDocumentUpload }: PDFUploaderProps) => {
  const toast = useToast()

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      // Upload PDF to Supabase Storage
      const uploadData = await uploadPDF(file)

      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage.from('pdfs').getPublicUrl(uploadData.path)
      const publicUrl = publicUrlData.publicUrl

      // Create document metadata
      const document: Document = {
        name: file.name,
        originalUrl: publicUrl, // Use the public URL for preview
        userId: 'temp-user-id', // We'll replace this with actual user ID later
        createdAt: new Date().toISOString(),
        signed: false,
        signatureType: 'typed',
        signatureData: '',
        signaturePosition: {
          page: 1,
          x: 0,
          y: 0,
        },
      }

      // Save document metadata to Supabase Database
      await saveDocumentMetadata(document)

      onDocumentUpload(document)

      toast({
        title: 'Success',
        description: 'PDF uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error: any) {
      let errorMessage = 'Failed to upload PDF'
      
      if (error.message?.includes('Bucket not found')) {
        errorMessage = 'Storage bucket not found. Please create a bucket named "pdfs" in your Supabase dashboard.'
      } else if (error.message?.includes('does not exist')) {
        errorMessage = error.message
      }

      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      console.error('Upload error:', error)
    }
  }, [onDocumentUpload, toast])

  return (
    <Box>
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        id="pdf-upload"
      />
      <Button
        as="label"
        htmlFor="pdf-upload"
        colorScheme="blue"
        cursor="pointer"
      >
        Upload PDF
      </Button>
    </Box>
  )
}

export default PDFUploader 