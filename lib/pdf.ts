import html2pdf from "html2pdf.js";

export async function downloadElementAsPdf(
  elementId: string,
  fileName: string
) {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error(`Element not found: ${elementId}`);
  }

  const options = {
    margin: 0.5,
    filename: fileName,
    image: {
      type: "jpeg" as const,
      quality: 0.98,
    },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    },
    jsPDF: {
      unit: "in",
      format: "a4",
      orientation: "portrait",
    },
    pagebreak: {
      mode: ["avoid-all", "css", "legacy"] as const,
    },
  };

  await html2pdf().set(options).from(element).save();
}