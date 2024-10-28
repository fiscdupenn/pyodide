"use client"
import { useEffect, useState, useCallback } from "react";

const PyodidePlot = () => {
  const [pyodide, setPyodide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [plotSrc, setPlotSrc] = useState(null);
  const [isPyodideLoaded, setIsPyodideLoaded] = useState(false);

  const loadPyodide = useCallback(async () => {
    setLoading(true);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.23.2/full/pyodide.js";
    script.onload = async () => {
      const pyodideInstance = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.2/full/",
      });
      await pyodideInstance.loadPackage("micropip");
      await pyodideInstance.runPythonAsync(`
          import micropip
          await micropip.install('matplotlib')
      `);
      setPyodide(pyodideInstance);
      setIsPyodideLoaded(true);
      setLoading(false);
    };
    document.body.appendChild(script);
  }, []);

  const generatePlot = useCallback(async () => {
    if (!pyodide) return;

    setLoading(true);

    const pythonCode = `
import matplotlib.pyplot as plt
import io
import base64

plt.figure()
plt.plot([0, 1, 2, 3], [0, 1, 4, 9])
plt.title('React matplotlib Plot')

buf = io.BytesIO()
plt.savefig(buf, format='png')
buf.seek(0)
plot_data = base64.b64encode(buf.read()).decode('utf-8')
plot_data
    `;

    try {
      const plotData = await pyodide.runPythonAsync(pythonCode);
      setPlotSrc(`data:image/png;base64,${plotData}`);
    } catch (error) {
      console.error("Error generating plot:", error);
    }

    setLoading(false);
  }, [pyodide]);

  // Debounce function to prevent multiple rapid calls
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const handleGeneratePlot = debounce(async () => {
    if (!isPyodideLoaded) {
      await loadPyodide();
    }
    await generatePlot();
  }, 300);

  return (
    <div>
      {loading && <p>Loading...</p>}
      {!loading && <button onClick={handleGeneratePlot}>Generate Plot</button>}
      {plotSrc && (
        <div>
          <h3>Generated Plot:</h3>
          <img src={plotSrc} alt="Matplotlib Plot" />
        </div>
      )}
    </div>
  );
};

export default PyodidePlot;