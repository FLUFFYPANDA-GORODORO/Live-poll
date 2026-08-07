"use client";

import React from "react";
import { Code, Video } from "lucide-react";

export default function ContentPresentView({ question, themeStyles = {} }) {
  const elements = question?.elements || [];
  const bgColor = question?.backgroundColor || themeStyles.backgroundStyle?.backgroundColor || "#FFFFFF";
  const bgImg = question?.backgroundImage;

  return (
    <div
      className="w-full max-w-6xl h-[540px] md:h-[600px] mx-auto rounded-[28px] border-[3px] border-white/20 shadow-2xl relative overflow-hidden my-auto"
      style={{
        backgroundColor: bgColor,
        backgroundImage: bgImg ? `url(${bgImg})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {elements.map((elem) => {
        // Scale elements proportionally to fit presentation container (800x450 reference size)
        const scaleX = 1152 / 800; // max-w-6xl is 1152px wide
        const scaleY = 560 / 450;

        return (
          <div
            key={elem.id}
            className="absolute transition-all"
            style={{
              left: `${elem.x * scaleX}px`,
              top: `${elem.y * scaleY}px`,
              width: `${elem.width * scaleX}px`,
              height: `${elem.height * scaleY}px`,
            }}
          >
            {elem.type === "text" && (
              <div
                className="w-full h-full flex items-center whitespace-pre-wrap"
                style={{
                  justifyContent:
                    elem.align === "center"
                      ? "center"
                      : elem.align === "right"
                      ? "flex-end"
                      : "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: `${(elem.fontSize || 32) * scaleY}px`,
                    fontWeight: elem.fontWeight || "normal",
                    fontStyle: elem.fontStyle || "normal",
                    color: elem.color || "#1E293B",
                    textAlign: elem.align || "left",
                    lineHeight: 1.25,
                  }}
                >
                  {elem.text}
                </span>
              </div>
            )}

            {elem.type === "sticky" && (
              <div
                className="w-full h-full p-4 rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden"
                style={{ backgroundColor: elem.fill || "#FEF08A" }}
              >
                <p className="text-sm md:text-base font-semibold text-slate-800 whitespace-pre-wrap">{elem.text}</p>
              </div>
            )}

            {elem.type === "button" && (
              <div
                className="w-full h-full rounded-2xl flex items-center justify-center font-bold text-base shadow-lg"
                style={{ backgroundColor: elem.bg || "#6366F1", color: elem.color || "#FFFFFF" }}
              >
                {elem.text}
              </div>
            )}

            {elem.type === "tag" && (
              <div
                className="w-full h-full rounded-full flex items-center justify-center font-bold text-sm shadow-md"
                style={{ backgroundColor: elem.bg || "#10B981", color: elem.color || "#FFFFFF" }}
              >
                {elem.text}
              </div>
            )}

            {elem.type === "shape" && (
              <div className="w-full h-full flex items-center justify-center">
                {elem.shapeType === "circle" ? (
                  <div
                    className="w-full h-full rounded-full shadow-lg"
                    style={{
                      backgroundColor: elem.fill || "#6366F1",
                      border: `${(elem.strokeWidth || 0) * scaleX}px solid ${elem.stroke || "transparent"}`,
                    }}
                  />
                ) : elem.shapeType === "triangle" ? (
                  <div
                    className="w-0 h-0 border-l-[80px] border-l-transparent border-r-[80px] border-r-transparent border-b-[140px]"
                    style={{ borderBottomColor: elem.fill || "#6366F1" }}
                  />
                ) : elem.shapeType === "line" ? (
                  <div className="w-full h-1.5" style={{ backgroundColor: elem.fill || "#1E293B" }} />
                ) : elem.shapeType === "arrow" ? (
                  <div className="w-full flex items-center">
                    <div className="flex-1 h-1.5" style={{ backgroundColor: elem.fill || "#6366F1" }} />
                    <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-10" style={{ borderLeftColor: elem.fill || "#6366F1" }} />
                  </div>
                ) : (
                  <div
                    className="w-full h-full rounded-3xl shadow-lg"
                    style={{
                      backgroundColor: elem.fill || "#6366F1",
                      border: `${(elem.strokeWidth || 0) * scaleX}px solid ${elem.stroke || "transparent"}`,
                    }}
                  />
                )}
              </div>
            )}

            {elem.type === "media" && elem.url && (
              <img
                src={elem.url}
                alt="Media"
                className="w-full h-full object-cover rounded-2xl shadow-xl"
              />
            )}

            {elem.type === "chart" && (
              <div className="w-full h-full bg-white/95 backdrop-blur-xs border border-slate-200 rounded-3xl p-4 shadow-xl flex flex-col justify-between">
                <span className="text-sm font-bold text-slate-800">{elem.title}</span>
                <div className="flex items-end justify-between gap-3 h-36 pt-2">
                  {elem.data?.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        className="w-full bg-[#6366F1] rounded-t-lg transition-all duration-700"
                        style={{ height: `${d.value}%` }}
                      />
                      <span className="text-xs font-semibold text-slate-600 mt-1 truncate max-w-[60px]">
                        {d.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {elem.type === "table" && (
              <div className="w-full h-full bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-xl p-2">
                <table className="w-full h-full border-collapse text-sm">
                  <tbody>
                    {elem.data?.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`border border-slate-200 p-2 text-center font-medium ${
                              rIdx === 0 ? "bg-slate-100 font-bold text-slate-900" : "text-slate-800"
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {elem.type === "embed" && (
              <div className="w-full h-full bg-slate-950 text-white rounded-3xl p-4 flex flex-col items-center justify-center gap-3 shadow-2xl relative overflow-hidden">
                <div className="w-full h-36 rounded-2xl bg-red-600/90 flex items-center justify-center">
                  <Video className="w-10 h-10 text-white fill-white" />
                </div>
                <span className="text-sm font-bold text-center truncate max-w-full px-2">
                  {elem.title || elem.provider}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
