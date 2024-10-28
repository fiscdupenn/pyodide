"use client"
import { useEffect, useState } from "react";

const PyodidePlot = () => {
  const [pyodide, setPyodide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plotSrc, setPlotSrc] = useState(null);

  useEffect(() => {
    // Dynamically load Pyodide script
    const loadPyodideScript = async () => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.23.2/full/pyodide.js";
      script.onload = async () => {
        const pyodideInstance = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.2/full/",
        });
        // Ensure matplotlib is installed
        await pyodideInstance.loadPackage("micropip");
        await pyodideInstance.runPythonAsync(`
            import micropip
            await micropip.install('matplotlib')
        `);
        setPyodide(pyodideInstance);
        setLoading(false);
      };
      document.body.appendChild(script);
    };

    loadPyodideScript();
  }, []);

  const generatePlot = async () => {
    if (!pyodide) return;

    setLoading(true);

    const pythonCode = `
import matplotlib.pyplot as plt
import io
import base64

# Generate plot
plt.figure()
plt.plot([0, 1, 2, 3], [0, 1, 4, 9])
plt.title('React matplotlib Plot')

# Save the plot to a PNG in-memory
buf = io.BytesIO()
plt.savefig(buf, format='png')
buf.seek(0)

# Encode the PNG to base64
plot_data = base64.b64encode(buf.read()).decode('utf-8')
plot_data
    `;

    try {
      // Execute the Python code
      const plotData = await pyodide.runPythonAsync(pythonCode);

      setPlotSrc(`data:image/png;base64,${plotData}`);
    } catch (error) {
      console.error("Error generating plot:", error);
    }

    setLoading(false);
  };

  return (
    <div>
      {loading && <p>Loading Pyodide...</p>}
      {!loading && <button onClick={generatePlot}>Generate Plot</button>}
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
