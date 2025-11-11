// Better Format Markdown with proper line breaks
function formatMarkdown(text) {
  // Escape HTML first
  text = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headers (### and ##) - with proper spacing
  text = text.replace(
    /^### (.+)$/gm,
    '<div style="margin-top: 1.5rem; margin-bottom: 0.75rem;"><h3 style="color: #6366f1; font-size: 1.1rem; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin: 0;">$1</h3></div>'
  );
  text = text.replace(
    /^## (.+)$/gm,
    '<div style="margin-top: 1.5rem; margin-bottom: 0.75rem;"><h3 style="color: #6366f1; font-size: 1.2rem; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin: 0;">$1</h3></div>'
  );

  // Bold text - with line breaks
  text = text.replace(
    /\*\*(.+?)\*\*:/g,
    '<div style="margin-top: 0.75rem; margin-bottom: 0.25rem;"><strong style="color: #4f46e5; font-weight: 600; display: inline-block;">$1:</strong></div>'
  );
  text = text.replace(
    /\*\*(.+?)\*\*/g,
    '<strong style="color: #4f46e5; font-weight: 600;">$1</strong>'
  );

  // Process line by line for better control
  let lines = text.split('\n');
  let result = [];
  let inNumberedList = false;
  let inBulletList = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Numbered lists
    if (/^\d+\.\s+/.test(line)) {
      const content = line.replace(/^\d+\.\s+/, '');
      if (!inNumberedList) {
        if (inBulletList) {
          result.push('</ul>');
          inBulletList = false;
        }
        result.push('<ol style="margin-left: 1.5rem; margin-top: 0.75rem; margin-bottom: 1rem; list-style-type: decimal; padding-left: 0.5rem;">');
        inNumberedList = true;
      }
      result.push('<li style="margin-bottom: 0.75rem; line-height: 1.7;">' + content + '</li>');
    }
    // Bullet points
    else if (/^[\*\-]\s+/.test(line)) {
      const content = line.replace(/^[\*\-]\s+/, '');
      if (!inBulletList) {
        if (inNumberedList) {
          result.push('</ol>');
          inNumberedList = false;
        }
        result.push('<ul style="margin-left: 1.5rem; margin-top: 0.75rem; margin-bottom: 1rem; list-style-type: disc; padding-left: 0.5rem;">');
        inBulletList = true;
      }
      result.push('<li style="margin-bottom: 0.75rem; line-height: 1.7;">' + content + '</li>');
    }
    // Regular text
    else {
      if (inNumberedList) {
        result.push('</ol>');
        inNumberedList = false;
      }
      if (inBulletList) {
        result.push('</ul>');
        inBulletList = false;
      }
      
      if (line) {
        result.push('<div style="margin-bottom: 0.5rem; line-height: 1.8;">' + line + '</div>');
      } else {
        result.push('<div style="height: 0.5rem;"></div>');
      }
    }
  }
  
  // Close any open lists
  if (inNumberedList) result.push('</ol>');
  if (inBulletList) result.push('</ul>');

  text = result.join('');

  // Code blocks (inline)
  text = text.replace(
    /`(.+?)`/g,
    '<code style="background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 4px; font-family: monospace; font-size: 0.9rem; color: #dc2626;">$1</code>'
  );

  return text;
}
