const fs = require('fs');
const path = require('path');

function updateLessToCss(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(directory, file.name);
    
    if (file.isDirectory()) {
      updateLessToCss(filePath);
    } else if (file.name.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const updatedContent = content.replace(/@ant-design\/compatible\/assets\/index\.less/g, '@ant-design\/compatible\/assets\/index.css');
      
      if (updatedContent !== content) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    }
  }
}

updateLessToCss(path.join(__dirname, 'src'));