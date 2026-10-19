export function Toast({ text }) {
  return text ? <div className="toast" role="status">{text}</div> : null;
}
