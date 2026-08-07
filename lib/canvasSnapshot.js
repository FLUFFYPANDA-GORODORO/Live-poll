/**
 * Utility to render Content slide elements onto an HTML5 canvas and return a PNG Data URL snapshot.
 */
export async function generateContentSlideSnapshot(question, canvasWidth = 1200, canvasHeight = 675) {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("");
        return;
      }

      // 1. Draw Background
      const bgColor = question.backgroundColor || "#FFFFFF";
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 2. Draw Background Image if present
      if (question.backgroundImage) {
        const bgImg = new Image();
        bgImg.crossOrigin = "anonymous";
        bgImg.onload = () => {
          ctx.drawImage(bgImg, 0, 0, canvasWidth, canvasHeight);
          renderElements(ctx, question.elements || [], canvasWidth, canvasHeight, resolve, canvas);
        };
        bgImg.onerror = () => {
          renderElements(ctx, question.elements || [], canvasWidth, canvasHeight, resolve, canvas);
        };
        bgImg.src = question.backgroundImage;
        return;
      }

      renderElements(ctx, question.elements || [], canvasWidth, canvasHeight, resolve, canvas);
    } catch (err) {
      console.error("Error generating snapshot:", err);
      resolve("");
    }
  });
}

function renderElements(ctx, elements, canvasWidth, canvasHeight, resolve, canvas) {
  // Scale factor assuming base reference dimensions (e.g. 800x450 in editor)
  const scaleX = canvasWidth / 800;
  const scaleY = canvasHeight / 450;

  let imagePromises = [];

  elements.forEach((elem) => {
    const x = elem.x * scaleX;
    const y = elem.y * scaleY;
    const w = elem.width * scaleX;
    const h = elem.height * scaleY;

    if (elem.type === "text") {
      ctx.save();
      const fontSize = (elem.fontSize || 32) * scaleY;
      const fontWeight = elem.fontWeight || "normal";
      const fontStyle = elem.fontStyle || "normal";
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px sans-serif`;
      ctx.fillStyle = elem.color || "#1E293B";
      ctx.textAlign = elem.align || "left";
      ctx.textBaseline = "top";

      let textX = x;
      if (elem.align === "center") textX = x + w / 2;
      else if (elem.align === "right") textX = x + w;

      ctx.fillText(elem.text || "", textX, y, w);
      ctx.restore();
    } else if (elem.type === "shape") {
      ctx.save();
      ctx.fillStyle = elem.fill || "#6366F1";
      ctx.strokeStyle = elem.stroke || "transparent";
      ctx.lineWidth = (elem.strokeWidth || 0) * scaleX;

      if (elem.shapeType === "circle") {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
        ctx.fill();
        if (elem.stroke) ctx.stroke();
      } else if (elem.shapeType === "triangle") {
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.fill();
        if (elem.stroke) ctx.stroke();
      } else {
        // Rectangle / default
        ctx.fillRect(x, y, w, h);
        if (elem.stroke) ctx.strokeRect(x, y, w, h);
      }
      ctx.restore();
    } else if (elem.type === "sticky") {
      ctx.save();
      ctx.fillStyle = elem.fill || "#FEF08A";
      ctx.fillRect(x, y, w, h);
      ctx.font = `${16 * scaleY}px sans-serif`;
      ctx.fillStyle = elem.color || "#334155";
      ctx.textBaseline = "top";
      ctx.fillText(elem.text || "", x + 10, y + 10, w - 20);
      ctx.restore();
    } else if (elem.type === "button" || elem.type === "tag") {
      ctx.save();
      ctx.fillStyle = elem.bg || "#6366F1";
      ctx.fillRect(x, y, w, h);
      ctx.font = `bold ${14 * scaleY}px sans-serif`;
      ctx.fillStyle = elem.color || "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(elem.text || "", x + w / 2, y + h / 2);
      ctx.restore();
    } else if (elem.type === "media" && elem.url) {
      const p = new Promise((resImg) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, x, y, w, h);
          resImg();
        };
        img.onerror = () => resImg();
        img.src = elem.url;
      });
      imagePromises.push(p);
    }
  });

  if (imagePromises.length > 0) {
    Promise.all(imagePromises).then(() => {
      resolve(canvas.toDataURL("image/png"));
    });
  } else {
    resolve(canvas.toDataURL("image/png"));
  }
}
