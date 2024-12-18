import { visit } from "unist-util-visit";

const graphPlugin = () => {
  return (tree: any) => {
    visit(tree, "text", (node) => {
      if (typeof node.value !== "string") return;

      const graphRegex = /<graph>(.*?)<\/graph>/g;
      const matches = [...node.value.matchAll(graphRegex)];

      if (matches.length > 0) {
        const newNodes = [];

        let lastIndex = 0;

        matches.forEach((match) => {
          try {
            const graphData = JSON.parse(match[1]);

            // Push the text before the match as a text node
            if (match.index > lastIndex) {
              newNodes.push({
                type: "text",
                value: node.value.slice(lastIndex, match.index),
              });
            }

            // Create a new JSX element node for the graph
            newNodes.push({
              type: "jsx",
              value: `<Graph 
                        title="${graphData.title}" 
                        type="${graphData.type}" 
                        xAxis="${graphData.xAxis}" 
                        yAxis="${graphData.yAxis}" 
                        data={${JSON.stringify(graphData.data)}} />`,
            });

            // Update the last index to the end of the current match
            lastIndex = match.index + match[0].length;
          } catch (error) {
            console.error("Error parsing graph data:", error);
          }
        });

        // If there's any text left after the last match, add it as a text node
        if (lastIndex < node.value.length) {
          newNodes.push({
            type: "text",
            value: node.value.slice(lastIndex),
          });
        }

        node.type = "element";
        node.children = newNodes;
      }
    });
  };
};

export { graphPlugin };
