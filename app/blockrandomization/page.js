"use client";

import { useEffect, useRef, useState } from "react";

const PyodidePlot = () => {
  const [pyodideLoading, setPyodideLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataSrc, setDataSrc] = useState(null);
  const [plotReady, setPlotReady] = useState(false);

  const [pythonCode, setPythonCode] = useState(`
    import random
    import pandas as pd
    import matplotlib.pyplot as plt
    
    # Define treatments and colors
    treatments = ["Treatment A", "Treatment B"]
    colors = {"Treatment A": "blue", "Treatment B": "green"}
    
    # Number of individuals and repetitions per treatment
    num_individuals = 12
    block_size = len(treatments)
    
    # Generate the block randomization
    block_randomization = []
    while len(block_randomization) < num_individuals:
        block = treatments * (num_individuals // (2 * block_size))  # Adjust repetitions
        random.shuffle(block)
        block_randomization.extend(block)
    
    # Trim the list to exactly the number of individuals
    block_randomization = block_randomization[:num_individuals]
    
    # Create a DataFrame to display
    data = {"Individual": range(1, num_individuals + 1), "Treatment": block_randomization}
    df = pd.DataFrame(data)
    
    # Plot individuals with their respective treatment and color
    plt.figure(figsize=(10, 6))
    for idx, row in df.iterrows():
        plt.bar(row["Individual"], 1, color=colors[row["Treatment"]], label=row["Treatment"] if idx < 2 else "")
        
    plt.xlabel("Individuals")
    plt.ylabel("Treatment Assignment")
    plt.title("Block Randomization with 2 Treatments")
    plt.xticks(df["Individual"])
    plt.yticks([])
    plt.legend()
    
    #
    # Save plot to a base64 string
    # The below code is needed to show plot on this webpage
    #
    import io
    import base64
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    img_str
  `);

  const pyodideRef = useRef(null);

  useEffect(() => {
    const loadPyodideScript = async () => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.23.2/full/pyodide.js";
      script.onload = async () => {
        const pyodideInstance = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.2/full/",
        });
        await pyodideInstance.loadPackage("micropip");
        // Load only essential packages first
        await pyodideInstance.runPythonAsync(`
          import micropip
          await micropip.install('numpy')
          await micropip.install('pandas')
        `);

        pyodideRef.current = pyodideInstance;
        setPyodideLoading(false);
      };
      document.body.appendChild(script);
    };

    loadPyodideScript();
  }, []);

  const generateData = async () => {
    if (!pyodideRef.current) return;

    setDataLoading(true);

    await pyodideRef.current.runPythonAsync(`
      import micropip
      await micropip.install('matplotlib')
      await micropip.install('seaborn')
    `);

    try {
      const outData = await pyodideRef.current.runPythonAsync(pythonCode);
      setDataSrc(`data:image/png;base64,${outData}`);
      setPlotReady(true);
    } catch (error) {
      console.error("Error generating data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  return (
    <div>
      <h1>This webpage generates a plot written in Python using matplotlib and seaborn.</h1>
      {pyodideLoading && !plotReady && <p>Loading Pyodide...</p>}
      {!pyodideLoading && (
        <>
          <textarea
            value={pythonCode}
            onChange={(e) => setPythonCode(e.target.value)}
            rows={35}
            cols={85}
          />
          <br></br>
          <button onClick={generateData} disabled={dataLoading}>
            {dataLoading ? "Generating Plot..." : "Generate Plot"}
          </button>
        </>
      )}
      {dataSrc && (
        <div>
          <h3>Generated Plot</h3>
          <img src={dataSrc} alt="Generated Plot" />
        </div>
      )}
    </div>
  );
};

export default PyodidePlot;