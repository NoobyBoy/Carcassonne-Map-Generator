<p align="center">
  <img src="images/title.png" alt="Carcassonne Map Generator" width="600"/>
</p>

# Carcassonne Map Generator

A web-based tool for generating custom Carcassonne game maps. Create beautiful, playable maps by automatically placing tiles that match each other perfectly.

**🌐 Try it online:** [https://noobyboy.github.io/Carcassonne-Map-Generator/](https://noobyboy.github.io/Carcassonne-Map-Generator/)


[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://html5.org/)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://www.w3.org/Style/CSS/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## What is this?

This project generates random Carcassonne maps using the official game tiles. The smart algorithm ensures that tiles only connect where their edges match - roads connect to roads, cities to cities, and fields to fields. Perfect for creating new scenarios or exploring different map layouts!

## Examples

<p align="center">
  <img src="images/example1.jpg" alt="Example map 1" width="400"/>
  <img src="images/example2.jpg" alt="Example map 2" width="400"/>
</p>

## How to Use

1. **Open the application** - Simply open `index.html` in your web browser
2. **Set your preferences** - Adjust grid size, starting position, and generation speed
3. **Click "Generate"** - Watch as your map is built automatically
4. **Explore** - Use zoom and pan controls to examine your creation
5. **Clear and retry** - Generate new maps with different settings


## How It Works

The generator uses a spiral algorithm to place tiles one at a time, always checking that the new tile's edges match with already-placed neighbors. Each tile can be rotated to find the best fit, creating realistic and playable maps every time.
