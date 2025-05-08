import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const checkBucketStatus = async () => {
  try {
    // First, let's list all buckets to see what's available
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    console.log('Available buckets:', buckets)

    if (listError) {
      console.error('Error listing buckets:', listError)
      return false
    }

    // Check if our bucket exists in the list
    const pdfsBucket = buckets?.find(bucket => bucket.name === 'pdfs')
    if (!pdfsBucket) {
      console.error('pdfs bucket not found in available buckets')
      return false
    }

    // Now try to get the specific bucket
    const { data, error } = await supabase.storage.getBucket('pdfs')
    if (error) {
      console.error('Bucket check error:', error)
      return false
    }

    console.log('Bucket details:', data)
    return true
  } catch (error) {
    console.error('Bucket check error:', error)
    return false
  }
}

export const uploadPDF = async (file: File) => {
  try {
    const bucketExists = await checkBucketStatus()
    if (!bucketExists) {
      throw new Error('Storage bucket "pdfs" does not exist. Please create it in your Supabase dashboard.')
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    console.log('Attempting to upload file:', fileName)

    const { data, error } = await supabase.storage
      .from('pdfs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      throw error
    }

    console.log('Upload successful:', data)
    return data
  } catch (error) {
    console.error('Upload process error:', error)
    throw error
  }
}

export const saveDocumentMetadata = async (document: {
  name: string
  originalUrl: string
  userId: string
  signed: boolean
  signatureType: 'typed' | 'drawn'
  signatureData: string
  signaturePosition: {
    page: number
    x: number
    y: number
  }
}) => {
  try {
    console.log('Saving document metadata:', document)
    const { data, error } = await supabase
      .from('documents')
      .insert([document])
      .select()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Save metadata error:', error)
    throw error
  }
} 



//-----
// export const checkBucketStatus = async () => {
//     try {
//       // First, let's list all buckets to see what's available
//       const { data: buckets, error: listError } = await supabase.storage.listBuckets();
//       console.log('Available buckets:', buckets);
  
//       if (listError) {
//         console.error('Error listing buckets:', listError);
//         return false;
//       }
  
//       // Check if our bucket exists in the list
//       const pdfsBucket = buckets?.find(bucket => bucket.name === 'pdfs');
//       if (!pdfsBucket) {
//         console.error('pdfs bucket not found in available buckets');
//         return false;
//       }
  
//       // Now try to get the specific bucket
//       const { data, error } = await supabase.storage.getBucket('pdfs');
//       if (error) {
//         console.error('Bucket check error:', error);
//         return false;
//       }
  
//       console.log('Bucket details:', data);
//       return true;
//     } catch (error) {
//       console.error('Bucket check error:', error);
//       return false;
//     }
//   }