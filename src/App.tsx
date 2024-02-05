import { useState, useEffect, useMemo, useRef } from "react";
import "./App.css";
import { Coordinator } from "./coordinator";
import { Data, generateRandomData } from "./utils";

const plots = [
  {
    label: "Coordinator",
    description: "none",
    content: Coordinator,
  },
];

const dataSizes = [4000, 16000, 64000, 128000];

const circleStyles = ["different", "same"];

function avg(arr: number[]) {
  return arr.reduce((a, b) => a + b) / arr.length;
}

function App() {
  const [currentPlot, setCurrentPlot] = useState(0);
  const [currentCircleStyle, setCurrentCircleStyle] = useState(0); // [0, 1];
  const [numCircles, setNumCircles] = useState(4000);
  const [fps, setFps] = useState(120);
  const [isRecordingMinFps, setIsRecordingMinFps] = useState(false);
  const plot = useRef<Coordinator>();
  const [minFps, setMinFps] = useState<number>();
  const lastFiveFps = useRef<number[]>([]);

  const data: Data[] = useMemo(
    () =>
      generateRandomData({
        count: numCircles,
        maxX: 4000,
        maxY: 4000,
        startX: 0,
        startY: 0,
        style: circleStyles[currentCircleStyle],
      }),
    [numCircles, currentCircleStyle]
  );

  async function zoomLoop() {
    await plot.current?.scaleTo(0.05);
    setIsRecordingMinFps(true);
    await plot.current?.scaleTo(1);
    setIsRecordingMinFps(false);
  }

  useEffect(() => {
    lastFiveFps.current.push(fps);
    // Look at a window of the last 5 fps values
    if (lastFiveFps.current.length > 5) {
      lastFiveFps.current.shift();
    }
    const avgFps = avg(lastFiveFps.current);
    if (isRecordingMinFps && (minFps === undefined || avgFps < minFps)) {
      setMinFps(avgFps);
    }
    // This dependency array is not ideal since fps will get added to recordedFps.current a few extra times
    // Minimal impact on accuracy though
  }, [fps, minFps, isRecordingMinFps]);

  useEffect(() => {
    // Cleanup the old plot to avoid memory leaks
    plot.current?.destroy();
    setMinFps(undefined);

    // Create the new plot
    const plotElement = document.getElementById("plot") as HTMLDivElement;
    plotElement.innerHTML = "";
    const newPlot = new plots[currentPlot].content(
      500,
      500,
      plotElement,
      setFps
    );


    newPlot.addPlot(data, { x: 10, y: 10, width: 480, height: 150 });
    newPlot.addPlot(data, { x: 10, y: 170, width: 480, height: 150 });

    plot.current = newPlot;
    zoomLoop();
  }, [currentPlot, numCircles, data]);

  return (
    <>
      <div className="top-corner">
        <a href="https://github.com/etowahadams/pixijs-rendering-comparison">
          See on GitHub
        </a>
      </div>
      <h1>PixiJS Plots</h1>
      <div className="card">
        <p className="label">Rendering strategy:</p>
        {plots.map((plot, i) => {
          return (
            <button
              key={i}
              className={i === currentPlot ? "active" : ""}
              onClick={() => {
                setCurrentPlot(i);
              }}
            >
              {plot.label}
            </button>
          );
        })}
      </div>
      <div className="desc">{plots[currentPlot].description} </div>
      <div className="card">
        <p className="label">Number of points:</p>
        {dataSizes.map((num, i) => {
          return (
            <button
              key={i}
              className={num === numCircles ? "active" : ""}
              onClick={() => {
                setNumCircles(num);
              }}
            >
              {num}
            </button>
          );
        })}
      </div>
      <div className="card">
        <p className="label">Point style:</p>
        {circleStyles.map((style, i) => {
          return (
            <button
              key={i}
              className={i === currentCircleStyle ? "active" : ""}
              onClick={() => {
                setCurrentCircleStyle(i);
              }}
            >
              {style}
            </button>
          );
        })}
      </div>
      <div className="card">
        <div className="desc">
          Lowest FPS: <b>{minFps ? minFps.toFixed(0) : "..."}</b>, Current FPS:{" "}
          {lastFiveFps.current.length > 0 &&
            Math.min(...lastFiveFps.current).toFixed(0)}
        </div>
      </div>
      <div className="card" id="plot"></div>
    </>
  );
}

export default App;
