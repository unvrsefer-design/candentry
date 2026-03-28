export async function downloadElementAsPdf(
  elementId: string,
  fileName: string
) {
  if (typeof window === "undefined") {
    return;
  }

  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error(`Element not found: ${elementId}`);
  }

  const html2pdfModule = await import("html2pdf.js");
  const html2pdf = html2pdfModule.default;

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
      orientation: "portrait" as const,
    },
    pagebreak: {
      mode: ["avoid-all", "css", "legacy"] as const,
    },
  };

  await html2pdf().set(options).from(element).save();
}