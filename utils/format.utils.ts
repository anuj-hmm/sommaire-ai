export function formatFileNameAsTitle(fileName: string): string {
    // Example: remove extension and replace dashes/underscores with spaces, capitalize
    const withoutExtension= fileName.replace(/\.[^/.]+$/, '');
    const withSpaces=withoutExtension.replace(/[-_]+/g, ' ') //Replace dashes and underscores with spaces
    .replace(/([a-z])([A-Z])/g,'$1 $2'); //Add space between camecase

    //convert to title case (capitalize first letter of each word)
    return withSpaces
    .split(' ')
    .map((word)=>word.charAt(0).toUpperCase()+ word.slice(1).toLowerCase())
    .join(' ')
    .trim();
      
  }