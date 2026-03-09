import { useEffect, useState } from "react";
import { Layer, Stage } from "react-konva";
import { ShroomNode } from "./shroom-node";
import { ZENIK_SHROOMS } from "@/types/shroom-events";

const meta = {
  title: "Zenik Office/ShroomNode",
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#0d0d0d" }] },
  },
};

export default meta;

function AnimatedStage({ children }: { children: (t: number) => React.ReactNode }) {
  const [t, setT] = useState(0);

  useEffect(() => {
    let id: number;
    const tick = (time: number) => {
      setT(time);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <Stage width={700} height={200}>
      <Layer>{children(t)}</Layer>
    </Stage>
  );
}

export const AllVariants = {
  render: () => (
    <AnimatedStage>
      {(t) =>
        ZENIK_SHROOMS.map((shroom, i) => (
          <ShroomNode
            key={shroom.id}
            shroom={shroom}
            x={70 + i * 140}
            y={90}
            driftX={0}
            driftY={0}
            t={t}
            onClick={() => {}}
          />
        ))
      }
    </AnimatedStage>
  ),
};

export const Static = {
  render: () => (
    <Stage width={700} height={200}>
      <Layer>
        {ZENIK_SHROOMS.map((shroom, i) => (
          <ShroomNode
            key={shroom.id}
            shroom={shroom}
            x={70 + i * 140}
            y={90}
            driftX={0}
            driftY={0}
            t={0}
            onClick={() => {}}
          />
        ))}
      </Layer>
    </Stage>
  ),
};
