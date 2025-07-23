'use server' 

export async function handleUploadAction(formData: FormData) {
  const uploadedFile = formData.get("file") as File;
  console.log("file uploaded", uploadedFile);
  
  const buffer = await uploadedFile.arrayBuffer();
  const fileBuffer = Buffer.from(buffer);
  console.log("buffer: ", fileBuffer)

  //await fs.writeFile(audioFile.name, audioBuffer);
}