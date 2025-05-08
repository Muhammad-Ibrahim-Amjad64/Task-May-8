import { Box, Container, Heading, VStack, Button } from '@chakra-ui/react'
import PDFUploader from './components/PDFUploader'
import PDFViewer from './components/PDFViewer'
import SignaturePad from './components/SignaturePad'
import { useState } from 'react'
import { Document, SignatureData } from './types'
import { saveDocumentMetadata, uploadPDF, supabase } from './config/supabase'
import { PDFDocument as PDFLibDocument, rgb } from 'pdf-lib'

function App() {
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [selectedPage, setSelectedPage] = useState<number>(1)
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null)
  const [signaturePosition, setSignaturePosition] = useState<{ x: number; y: number } | null>(null)
  const [isPlacing, setIsPlacing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null)

  // Handler for when signature is created
  const handleSignatureComplete = (sig: SignatureData) => {
    setSignatureData(sig)
    setIsPlacing(true)
  }

  // Handler for when signature is placed on PDF
  const handleSignaturePlaced = (pos: { x: number; y: number }) => {
    setSignaturePosition(pos)
    setIsPlacing(false)
  }

  // Handler for confirming and saving the signed PDF
  const handleConfirmAndSave = async () => {
    if (!currentDocument || !signatureData || !signaturePosition) return
    setIsSaving(true)
    try {
      // Fetch the original PDF
      const response = await fetch(currentDocument.originalUrl)
      const arrayBuffer = await response.arrayBuffer()
      const pdfDoc = await PDFLibDocument.load(arrayBuffer)
      const page = pdfDoc.getPage(selectedPage - 1)

      // Add signature (typed or drawn)
      let signatureImageEmbed, signatureDims
      if (signatureData.type === 'drawn') {
        const pngImageBytes = await fetch(signatureData.data).then(res => res.arrayBuffer())
        signatureImageEmbed = await pdfDoc.embedPng(pngImageBytes)
        signatureDims = signatureImageEmbed.scale(0.5)
        page.drawImage(signatureImageEmbed, {
          x: signaturePosition.x,
          y: signaturePosition.y,
          width: signatureDims.width,
          height: signatureDims.height,
        })
      } else {
        // Typed signature as text
        page.drawText(signatureData.data, {
          x: signaturePosition.x,
          y: signaturePosition.y,
          size: 24,
          color: rgb(0, 0, 0),
        })
      }

      // Save the signed PDF
      const signedPdfBytes = await pdfDoc.save()
      const signedPdfBlob = new Blob([signedPdfBytes], { type: 'application/pdf' })
      const signedFile = new File([signedPdfBlob], `signed_${currentDocument.name}`, { type: 'application/pdf' })
      const uploadData = await uploadPDF(signedFile)
      const { data: publicUrlData } = supabase.storage.from('pdfs').getPublicUrl(uploadData.path)
      const publicUrl = publicUrlData.publicUrl
      setSignedPdfUrl(publicUrl)

      // Update metadata
      await saveDocumentMetadata({
        ...currentDocument,
        signedUrl: publicUrl,
        signed: true,
        signatureType: signatureData.type,
        signatureData: signatureData.data,
        signaturePosition: {
          page: selectedPage,
          x: signaturePosition.x,
          y: signaturePosition.y,
        },
      })
    } catch (err) {
      alert('Failed to save signed PDF!')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8}>
        <Heading>PDF Signing Application</Heading>
        <Box w="full">
          <PDFUploader onDocumentUpload={setCurrentDocument} />
        </Box>
        {currentDocument && (
          <>
            <Box w="full" display="flex" gap={4}>
              <Box flex={1}>
                <PDFViewer
                  document={currentDocument}
                  selectedPage={selectedPage}
                  onPageChange={setSelectedPage}
                  signatureData={signatureData}
                  signaturePosition={signaturePosition}
                  isPlacing={isPlacing}
                  onSignaturePlaced={handleSignaturePlaced}
                />
              </Box>
              <Box flex={1}>
                <SignaturePad
                  onSignatureComplete={handleSignatureComplete}
                />
                {signatureData && signaturePosition && (
                  <Button
                    mt={4}
                    colorScheme="green"
                    onClick={handleConfirmAndSave}
                    isLoading={isSaving}
                  >
                    Confirm and Save
                  </Button>
                )}
                {signedPdfUrl && (
                  <Box mt={4}>
                    <a href={signedPdfUrl} target="_blank" rel="noopener noreferrer">
                      View Signed PDF
                    </a>
                  </Box>
                )}
              </Box>
            </Box>
          </>
        )}
      </VStack>
    </Container>
  )
}

export default App 