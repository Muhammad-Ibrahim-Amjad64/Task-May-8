export interface Document {
  id?: string;
  name: string;
  originalUrl: string;
  signedUrl?: string;
  userId: string;
  createdAt: string;
  signed: boolean;
  signatureType: 'typed' | 'drawn';
  signatureData: string;
  signaturePosition: {
    page: number;
    x: number;
    y: number;
  };
}

export interface SignatureData {
  type: 'typed' | 'drawn';
  data: string;
  style?: {
    fontWeight?: 'bold' | 'normal';
    fontStyle?: 'italic' | 'normal';
    fontFamily?: string;
    fontSize?: number;
  };
  position: {
    page: number;
    x: number;
    y: number;
  };
} 