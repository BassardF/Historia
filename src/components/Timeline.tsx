import { select } from "d3";
import * as React from "react";
import mockData from "../services/mocks/mock-data";
import "./Timeline.css";

const SVG_NODE_ID = "svg-wrapper";
const TIMELINE_LAT_MARGINS = 40;
const LAT_MARGINS = 2 * TIMELINE_LAT_MARGINS;
const MIN_PIXEL_GAP = 200;

interface Event {
  id: number;
  dateStart: number;
  description: string;
  title: string;
}

class Timeline extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = mockData;
  }

  public componentDidMount() {
    this.draw();
  }

  public render() {
    const { selectedEvent } = this.state;
    return (
      <div className="timeline">
        <svg id={SVG_NODE_ID} />
        {selectedEvent && (
          <div
            className="event-card"
            style={
              selectedEvent.right
                ? { top: selectedEvent.y, left: selectedEvent.x }
                : { top: selectedEvent.y, right: selectedEvent.x }
            }
          >
            <h3>{selectedEvent.event.title}</h3>
            <p>{selectedEvent.event.description}</p>
          </div>
        )}
      </div>
    );
  }

  private hoverEvent(
    event: Event,
    bonds: ClientRect,
    center: number,
    fromTitle: boolean
  ) {
    const y = bonds.bottom + (fromTitle ? 17 : 0);
    this.setState({
      selectedEvent:
        (bonds.left + bonds.right) / 2 < center
          ? {
              event,
              right: true,
              x: bonds.left,
              y
            }
          : {
              event,
              right: false,
              x: 2 * center - bonds.right,
              y
            }
    });
  }

  private minimumExtentionFactor(events: [Event], pixelPerYear: number) {
    let factor = 1;
    let loopGuard = 1;
    let gaps = [];
    let isValid = false;
    do {
      gaps = events.map((event: Event, index: number) =>
        index
          ? ((event.dateStart - events[index - 1].dateStart) / pixelPerYear) *
            factor
          : 0
      );
      loopGuard++;
      isValid = gaps.every(gap => gap === 0 || gap > MIN_PIXEL_GAP);
      if (!isValid) {
        factor += factor / 10;
      }
    } while (!isValid && loopGuard < 100);

    return factor;
  }

  private draw() {
    const svgNode = document.getElementById(SVG_NODE_ID);
    const events = this.state.data.events;
    if (!svgNode || !events) {
      return;
    }
    const fullDimensions = {
      height: svgNode.clientHeight,
      width: svgNode.clientWidth
    };
    const innerWidth = fullDimensions.width - 2 * LAT_MARGINS;
    const initDate = events[0].dateStart;
    const timeSpan = Math.abs(
      (events[events.length - 1].dateEnd ||
        events[events.length - 1].dateStart) - initDate
    );
    const pixelPerYear = timeSpan / innerWidth;
    const factor = this.minimumExtentionFactor(events, pixelPerYear);
    // Draw the timeline
    select(svgNode)
      .append("line")
      .attr("x1", () => TIMELINE_LAT_MARGINS)
      .attr("x2", () => fullDimensions.width - TIMELINE_LAT_MARGINS)
      .attr("y1", () => fullDimensions.height / 2)
      .attr("y2", () => fullDimensions.height / 2)
      .attr("stroke-width", "2px")
      .attr("stroke", "black");

    // Draw the events
    const nodes = select(svgNode)
      .selectAll("circle")
      .data(events)
      .attr(
        "cx",
        (d: Event) =>
          LAT_MARGINS + ((d.dateStart - initDate) / pixelPerYear) * factor
      );

    nodes
      .enter()
      .append("circle")
      .attr("r", () => 5)
      .attr("cy", () => fullDimensions.height / 2)
      .attr(
        "cx",
        (d: Event) =>
          LAT_MARGINS + ((d.dateStart - initDate) / pixelPerYear) * factor
      )
      .attr("fill", "black")
      .attr("stroke", "white")
      .attr("stroke-width", "4px");

    nodes.exit().remove();

    // Draw the titles
    const titles = select(svgNode)
      .selectAll(".svg-title")
      .data(events)
      .attr(
        "x",
        (d: Event) =>
          LAT_MARGINS + ((d.dateStart - initDate) / pixelPerYear) * factor
      );

    titles
      .enter()
      .append("text")
      .attr("class", "svg-title")
      .text((d: Event) => d.title)
      .attr("text-anchor", "middle")
      .attr("y", (d: Event) => fullDimensions.height / 2 + 30)
      .attr(
        "x",
        (d: Event) =>
          LAT_MARGINS + ((d.dateStart - initDate) / pixelPerYear) * factor
      )
      .attr("fill", "black")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .on("mouseover", (d: Event, index: number, items: [SVGElement]) => {
        const target: SVGElement = items[index];
        this.hoverEvent(
          d,
          target.getBoundingClientRect(),
          fullDimensions.width / 2,
          true
        );
      });

    titles.exit().remove();

    // Draw the dates
    const dates = select(svgNode)
      .selectAll(".svg-date")
      .data(events)
      .attr(
        "x",
        (d: Event) =>
          LAT_MARGINS + ((d.dateStart - initDate) / pixelPerYear) * factor
      );

    dates
      .enter()
      .append("text")
      .attr("class", "svg-date")
      .text((d: Event) => new Date(d.dateStart).getFullYear())
      .attr("text-anchor", "middle")
      .attr("y", (d: Event) => fullDimensions.height / 2 - 20)
      .attr(
        "x",
        (d: Event) =>
          LAT_MARGINS + ((d.dateStart - initDate) / pixelPerYear) * factor
      )
      .attr("fill", "black")
      .attr("font-size", "14px");

    dates.exit().remove();

    // Draw the interaction area
    const interactions = select(svgNode)
      .selectAll(".svg-interaction")
      .data(events)
      .attr(
        "x",
        (d: Event) =>
          LAT_MARGINS + ((d.dateStart - initDate) / pixelPerYear) * factor
      );

    interactions
      .enter()
      .append("rect")
      .attr("class", "svg-interaction")
      .attr("y", (d: Event) => fullDimensions.height / 2 - 50)
      .attr(
        "x",
        (d: Event) =>
          LAT_MARGINS + ((d.dateStart - initDate) / pixelPerYear) * factor - 50
      )
      .attr("width", 100)
      .attr("height", 100)
      .attr("fill-opacity", "0")
      .on("mouseover", (d: Event, index: number, items: [SVGElement]) => {
        const target: SVGElement = items[index];
        this.hoverEvent(
          d,
          target.getBoundingClientRect(),
          fullDimensions.width / 2,
          false
        );
      });

    interactions.exit().remove();

    // Draw the arrow
    const p1 = `${fullDimensions.width -
      TIMELINE_LAT_MARGINS / 2 -
      5},${innerHeight / 2 - 10}`;
    const p2 = `${fullDimensions.width -
      TIMELINE_LAT_MARGINS / 2 +
      5},${innerHeight / 2}`;
    const p3 = `${fullDimensions.width -
      TIMELINE_LAT_MARGINS / 2 -
      5},${innerHeight / 2 + 10}`;
    select(svgNode)
      .append("path")
      .attr("d", `M${p1}L${p2}L${p3}`)
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("fill", "none");

    select(svgNode)
      .append("circle")
      .attr("r", () => 15)
      .attr("cy", () => innerHeight / 2)
      .attr("cx", (d: Event) => fullDimensions.width - TIMELINE_LAT_MARGINS / 2)
      .attr("fill", "black")
      .attr("fill-opacity", ".1")
      .on("click", (d: Event) => {
        console.log("click");
      });
  }
}

export default Timeline;
