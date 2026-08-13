export function Widget({ html }) {
  localStorage.setItem("access_token", "demo");
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
