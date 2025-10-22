import React from "react";

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef } from 'react'
import { useLocation } from "react-router-dom";
function Stairs() {

  const stairparentref = useRef(null);
  useGSAP(() => {
    const tl = gsap.timeline();

    // show parent instantly
    tl.set(stairparentref.current, { display: "block" });

    // animate stairs height
    tl.from(".stair", {
      height: 0,
      stagger: { amount: -0.25 },
    });

    // move stairs down
    tl.to(".stair", {
      y: "100%",
      stagger: { amount: -0.25 },
    });

    // hide parent instantly
    tl.set(stairparentref.current, { display: "none" });

    // reset stairs position
    tl.to(".stair", {
      y: "0%",
    });
  }, []);
  return (
    <div ref={stairparentref} className=" h-screen w-full fixed z-20 top-0">
      <div className=" h-screen w-full flex ">
        <div className="stair h-full w-1/5 bg-black"></div>
        <div className="stair h-full w-1/5 bg-black"></div>
        <div className="stair h-full w-1/5 bg-black"></div>
        <div className="stair h-full w-1/5 bg-black"></div>
        <div className="stair h-full w-1/5 bg-black"></div>
      </div>
    </div>
  );
}

export default Stairs
;
