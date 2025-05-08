import { Box, Select } from '@chakra-ui/react'
import { Document, Page, pdfjs } from 'react-pdf'
import { useState, useRef } from 'react'
import { Document as PDFDocument, SignatureData } from '../types'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PDFViewerProps {
  document: PDFDocument
  selectedPage: number
  onPageChange: (page: number) => void
  signatureData?: SignatureData | null
  signaturePosition?: { x: number; y: number } | null
  isPlacing?: boolean
  onSignaturePlaced?: (pos: { x: number; y: number }) => void
}

const PDFViewer = ({
  document,
  selectedPage,
  onPageChange,
  signatureData,
  signaturePosition,
  isPlacing,
  onSignaturePlaced,
}: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  // Mouse events for drag-and-drop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPlacing) return
    setDragging(true)
    setDragPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setDragPos({
      x: e.clientX - rect.left,
      y: rect.height - (e.clientY - rect.top), // PDF origin is bottom-left
    })
  }
  const handleMouseUp = () => {
    if (dragging && dragPos && onSignaturePlaced) {
      onSignaturePlaced(dragPos)
    }
    setDragging(false)
  }

  // Calculate overlay position
  const overlayStyle = dragPos || signaturePosition
    ? {
        position: 'absolute' as const,
        left: `${(dragPos || signaturePosition)?.x || 0}px`,
        bottom: `${(dragPos || signaturePosition)?.y || 0}px`,
        zIndex: 10,
        cursor: isPlacing ? 'grab' : 'default',
        pointerEvents: (isPlacing ? 'auto' : 'none') as React.CSSProperties['pointerEvents'],
      }
    : {}

  return (
    <Box borderWidth={1} borderRadius="md" p={4}>
      <Box mb={4}>
        <Select
          value={selectedPage}
          onChange={(e) => onPageChange(Number(e.target.value))}
        >
          {Array.from(new Array(numPages), (_, index) => (
            <option key={index + 1} value={index + 1}>
              Page {index + 1}
            </option>
          ))}
        </Select>
      </Box>
      <Box
        borderWidth={1}
        borderRadius="md"
        overflow="hidden"
        position="relative"
        ref={containerRef}
        minH="600px"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ userSelect: 'none' }}
      >
        <Document
          file={document.originalUrl}
          onLoadSuccess={handleDocumentLoadSuccess}
        >
          <Page
            pageNumber={selectedPage}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            scale={1.2}
          />
        </Document>
        {/* Signature overlay */}
        {(isPlacing || signaturePosition) && signatureData && (
          <Box style={overlayStyle}>
            {signatureData.type === 'drawn' ? (
              <img
                src={signatureData.data}
                alt="Signature"
                style={{ width: 150, height: 60, pointerEvents: isPlacing ? 'auto' : 'none' }}
                draggable={false}
              />
            ) : (
              <span
                style={{
                  fontFamily: signatureData.style?.fontFamily || 'cursive',
                  fontSize: signatureData.style?.fontSize || 32,
                  color: '#222',
                  background: 'rgba(255,255,255,0.7)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  pointerEvents: isPlacing ? 'auto' : 'none',
                  fontWeight: signatureData.style?.fontWeight || 'bold',
                  fontStyle: signatureData.style?.fontStyle || 'italic',
                  letterSpacing: 2,
                  textShadow: '1px 1px 2px #aaa',
                }}
              >
                {signatureData.data}
              </span>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default PDFViewer 