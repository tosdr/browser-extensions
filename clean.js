/*eslint no-undef: "off"*/
const fs = require('fs');
const path = require('path');

const foldersToDelete = ['/tsc', '/build', '/dist'];

function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive call for directories
        deleteFolderRecursive(curPath);
      } else {
        // Delete files
        fs.unlinkSync(curPath);
      }
    });
    // Delete the folder itself
    fs.rmdirSync(folderPath);
  }
}

// Delete specified folders
foldersToDelete.forEach((folder) => {
  const folderPath = path.join(__dirname, folder);
  deleteFolderRecursive(folderPath);
  console.log(`Deleted ${folder}`);
});

console.log('Deletion process complete.');
