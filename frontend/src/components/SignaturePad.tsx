import { Box, Button, Tabs, TabList, TabPanels, Tab, TabPanel, Input, HStack, Select as ChakraSelect } from '@chakra-ui/react'
import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { SignatureData } from '../types'

interface SignaturePadProps {
  onSignatureComplete: (signatureData: SignatureData) => void
}

const defaultFont = 'cursive'
const fontOptions = [
  { label: 'Cursive', value: 'cursive' },
  { label: 'Serif', value: 'serif' },
  { label: 'Sans-serif', value: 'sans-serif' },
  { label: 'Monospace', value: 'monospace' },
]

const SignaturePad = ({ onSignatureComplete }: SignaturePadProps) => {
  const [signatureType, setSignatureType] = useState<'typed' | 'drawn'>('typed')
  const [typedSignature, setTypedSignature] = useState('')
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [fontFamily, setFontFamily] = useState(defaultFont)
  const [fontSize, setFontSize] = useState(32)
  const signatureCanvasRef = useRef<SignatureCanvas>(null)

  const handleClear = () => {
    if (signatureType === 'drawn' && signatureCanvasRef.current) {
      signatureCanvasRef.current.clear()
    } else {
      setTypedSignature('')
    }
  }

  const handleSave = () => {
    let signatureData: SignatureData

    if (signatureType === 'drawn' && signatureCanvasRef.current) {
      signatureData = {
        type: 'drawn',
        data: signatureCanvasRef.current.toDataURL(),
        position: {
          page: 1,
          x: 0,
          y: 0,
        },
      }
    } else {
      signatureData = {
        type: 'typed',
        data: typedSignature,
        style: {
          fontWeight: isBold ? 'bold' : 'normal',
          fontStyle: isItalic ? 'italic' : 'normal',
          fontFamily,
          fontSize,
        },
        position: {
          page: 1,
          x: 0,
          y: 0,
        },
      }
    }

    onSignatureComplete(signatureData)
  }

  return (
    <Box borderWidth={1} borderRadius="md" p={4}>
      <Tabs onChange={(index) => setSignatureType(index === 0 ? 'typed' : 'drawn')}>
        <TabList>
          <Tab>Type Signature</Tab>
          <Tab>Draw Signature</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <HStack mb={2} spacing={2}>
              <Button
                size="sm"
                variant={isBold ? 'solid' : 'outline'}
                colorScheme="blue"
                fontWeight="bold"
                onClick={() => setIsBold((b) => !b)}
              >
                B
              </Button>
              <Button
                size="sm"
                variant={isItalic ? 'solid' : 'outline'}
                colorScheme="blue"
                fontStyle="italic"
                onClick={() => setIsItalic((i) => !i)}
              >
                I
              </Button>
              <ChakraSelect
                size="sm"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                width="auto"
              >
                {fontOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </ChakraSelect>
              <Input
                size="sm"
                type="number"
                min={16}
                max={64}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                width="60px"
                placeholder="Size"
              />
            </HStack>
            <Input
              value={typedSignature}
              onChange={(e) => setTypedSignature(e.target.value)}
              placeholder="Type your signature"
              mb={4}
              style={{
                fontFamily,
                fontWeight: isBold ? 'bold' : 'normal',
                fontStyle: isItalic ? 'italic' : 'normal',
                fontSize,
              }}
            />
          </TabPanel>
          <TabPanel>
            <Box
              borderWidth={1}
              borderRadius="md"
              mb={4}
              style={{ touchAction: 'none' }}
            >
              <SignatureCanvas
                ref={signatureCanvasRef}
                canvasProps={{
                  width: 500,
                  height: 200,
                  className: 'signature-canvas',
                }}
              />
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Box display="flex" gap={2}>
        <Button onClick={handleClear} colorScheme="gray">
          Clear
        </Button>
        <Button onClick={handleSave} colorScheme="blue">
          Save Signature
        </Button>
      </Box>
    </Box>
  )
}

export default SignaturePad 