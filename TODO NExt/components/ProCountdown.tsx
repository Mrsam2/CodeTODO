'use client';

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProCountdownProps {
  targetDate: string;
  label?: string;
  tint?: string;
  labelColor?: string;
  fontSize?: number;
  gap?: number;
  showSeparators?: boolean;
  fontFamily?: string;
  fontWeight?: number | string;
}

export function ProCountdown({
  targetDate,
  label = "COUNTDOWN",
  tint = "#ffffff",
  labelColor = "rgba(255, 255, 255, 0.65)",
  fontSize = 24, // Optimized default for dashboard card sizing
  gap = 14,
  showSeparators = true,
  fontFamily = "Inter",
  fontWeight = 800,
}: ProCountdownProps) {
  // 1. DYNAMIC FONT LOADER
  React.useEffect(() => {
    if (!fontFamily) return;
    const linkId = `font-${fontFamily.replace(/\s+/g, "-")}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.href = `https://fonts.googleapis.com/css?family=${fontFamily.replace(/\s+/g, "+")}:300,400,500,600,700,800,900&display=swap`;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }, [fontFamily]);

  // 2. TIMER LOGIC
  const [timeLeft, setTimeLeft] = React.useState(() => calculateTimeLeft(targetDate));

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const time = timeLeft || { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const style: React.CSSProperties = {
    ...containerStyle,
    gap: gap,
    color: tint,
    fontFamily: `"${fontFamily}", sans-serif`,
    fontWeight: fontWeight as React.CSSProperties['fontWeight'],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {label && (
        <span style={{
          fontSize: 9,
          textTransform: 'uppercase',
          fontWeight: 800,
          letterSpacing: '0.12em',
          color: labelColor,
          marginBottom: 8,
          textAlign: 'center',
          fontFamily: `"${fontFamily}", sans-serif`,
        }}>
          {label}
        </span>
      )}
      <div style={style}>
        <NumberGroup value={time.days} label="Days" tint={tint} labelColor={labelColor} fontSize={fontSize} fontFamily={fontFamily} />
        {showSeparators && <Separator fontSize={fontSize} tint={tint} fontFamily={fontFamily} />}
        <NumberGroup value={time.hours} label="Hours" tint={tint} labelColor={labelColor} fontSize={fontSize} fontFamily={fontFamily} />
        {showSeparators && <Separator fontSize={fontSize} tint={tint} fontFamily={fontFamily} />}
        <NumberGroup value={time.minutes} label="Mins" tint={tint} labelColor={labelColor} fontSize={fontSize} fontFamily={fontFamily} />
        {showSeparators && <Separator fontSize={fontSize} tint={tint} fontFamily={fontFamily} />}
        <NumberGroup value={time.seconds} label="Secs" tint={tint} labelColor={labelColor} fontSize={fontSize} fontFamily={fontFamily} />
      </div>
    </div>
  );
}

function Separator({ fontSize, tint, fontFamily }: { fontSize: number; tint: string; fontFamily: string }) {
  return (
    <div style={{
      ...separatorStyle,
      fontSize: fontSize,
      color: tint,
      fontFamily: `"${fontFamily}", sans-serif`,
      lineHeight: `${fontSize}px`,
      height: fontSize,
      display: 'flex',
      alignItems: 'center',
    }}>
      :
    </div>
  );
}

function NumberGroup({
  value,
  label,
  tint,
  labelColor,
  fontSize,
  fontFamily,
}: {
  value: number;
  label: string;
  tint: string;
  labelColor: string;
  fontSize: number;
  fontFamily: string;
}) {
  const digits = (value < 10 ? `0${value}` : `${value}`).split("");

  return (
    <div style={groupContainerStyle}>
      <div style={digitsRowStyle}>
        {digits.map((digit, index) => (
          <Digit key={index} value={digit} fontSize={fontSize} tint={tint} fontFamily={fontFamily} />
        ))}
      </div>
      <div style={{ ...labelStyle, color: labelColor, fontFamily: `"${fontFamily}", sans-serif` }}>
        {label}
      </div>
    </div>
  );
}

function Digit({ value, fontSize, tint, fontFamily }: { value: string; fontSize: number; tint: string; fontFamily: string }) {
  return (
    <div style={{
      position: "relative",
      height: fontSize * 1.1,
      width: fontSize * 0.65,
      overflow: "hidden",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          style={{
            fontSize: fontSize,
            lineHeight: 1,
            color: tint,
            position: "absolute",
            fontFamily: `"${fontFamily}", sans-serif`,
            fontWeight: "inherit",
          }}
          initial={{ y: "-60%", opacity: 0, filter: "blur(4px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "60%", opacity: 0, filter: "blur(4px)" }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 0.8,
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* --- LOGIC --- */
const calculateTimeLeft = (targetDate: string) => {
  const difference = +new Date(targetDate) - +new Date();
  if (difference > 0) {
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }
  return null;
};

/* --- STYLES --- */
const containerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "auto",
};

const groupContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const digitsRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
};

const separatorStyle: React.CSSProperties = {
  fontWeight: "bold",
  opacity: 0.35,
  marginTop: "-4px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  marginTop: "4px",
  textAlign: "center",
  opacity: 0.8,
};
