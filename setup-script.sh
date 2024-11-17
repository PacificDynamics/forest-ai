#!/bin/bash

# Create src directory structure
mkdir -p src/{components,layouts,pages,styles}

# Create component files
touch src/components/{Hero,Features,CaseStudies,CTASection,Navbar,Footer}.astro

# Create layout file
touch src/layouts/MainLayout.astro

# Create page files
touch src/pages/{index,features,case-studies,pricing,blog}.astro

# Create styles file
touch src/styles/global.css

# Create public directory structure
mkdir -p public/{images,icons}

# Create image files
touch public/images/{platform-preview,case-study-1,case-study-2}.jpg

# Create icon files
touch public/icons/{twitter,github,linkedin}.svg
touch public/logo.svg

# Create config and root files
touch astro.config.mjs
touch tailwind.config.mjs
touch tsconfig.json
touch netlify.toml
touch package.json
touch .env.example
touch .gitignore
touch README.md

# Print completion message
echo "Directory structure created successfully!"
ls -R