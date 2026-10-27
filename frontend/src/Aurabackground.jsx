import "./Aurabackground.css";

export default function AuraBackground({ children }) {
  return (
    <div className="aura-bg">
      <div className="aura-layer-1" aria-hidden="true" />
      <div className="aura-layer-2" aria-hidden="true" />
      <div className="aura-layer-3" aria-hidden="true" />

      <div className="aura-content">
        {children}
      </div>
    </div>
  );
}
