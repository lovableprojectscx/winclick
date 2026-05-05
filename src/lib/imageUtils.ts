// Comprime una imagen a máx 1200px y calidad 0.82 → File JPEG < ~500 KB
export async function compressImage(file: File): Promise<File> {
  if (file.type === "application/pdf") return file; // PDFs no se comprimen
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else                { width = Math.round((width * MAX) / height);  height = MAX; }
        }
        
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          resolve(file);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const newFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          "image/jpeg",
          0.82
        );
      };
      
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
