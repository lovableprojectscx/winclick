// Versión de ultra-compatibilidad para móviles
export async function compressImage(file: File): Promise<File> {
  // PDFs y archivos pequeños se pasan directo
  if (file.type === "application/pdf" || file.size < 200 * 1024) return file;
  
  return new Promise((resolve) => {
    // Timeout de seguridad: si en 3.5s no ha comprimido, devolvemos el original
    const timeout = setTimeout(() => {
      console.warn("Compression timeout, using original file");
      resolve(file);
    }, 3500);

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
          clearTimeout(timeout);
          resolve(file);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            clearTimeout(timeout);
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
          0.8
        );
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(file);
      };
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      clearTimeout(timeout);
      resolve(file);
    };
    reader.readAsDataURL(file);
  });
}
