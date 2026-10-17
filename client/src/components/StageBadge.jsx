export default function StageBadge({ stage }) {
  return <span className={`stage-badge stage-${stage.toLowerCase()}`}>{stage}</span>;
}
