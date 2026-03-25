import os

replacements = {
    # Text
    'text-white': 'text-slate-900',
    'text-dark-50': 'text-slate-800',
    'text-dark-100': 'text-slate-700',
    'text-dark-200': 'text-slate-600',
    'text-dark-300': 'text-slate-500',
    'text-dark-400': 'text-slate-500',
    'text-dark-500': 'text-slate-400',
    'text-dark-600': 'text-slate-300',
    
    # Backgrounds
    'bg-dark-950': 'bg-gray-50',
    'bg-dark-900': 'bg-white',
    'bg-dark-800': 'bg-white',
    'bg-dark-800/50': 'bg-gray-50',
    'bg-dark-800/30': 'bg-gray-50/50',
    'bg-dark-700/50': 'bg-gray-100',
    
    # Borders
    'border-dark-800': 'border-gray-200',
    'border-dark-800/50': 'border-gray-100',
    'border-dark-700': 'border-gray-200',
    'border-dark-700/50': 'border-gray-200',
    'border-dark-600': 'border-gray-300',
    
    # Gradients and dividers
    'border-t-dark-800/50': 'border-t-gray-100',
    'border-t-dark-700/50': 'border-t-gray-200',
    'divide-dark-800/50': 'divide-gray-100',
    'divide-dark-700/50': 'divide-gray-200',
    
    # Scrollbar
    'thumb-dark-800': 'thumb-gray-300',
    'thumb-hover-dark-700': 'thumb-hover-gray-400',
    'track-dark-950': 'track-transparent',
}

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                # Avoid modifying tailwind config etc, only src
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()
                
                new_content = content
                # Apply each replacement
                for old, new in replacements.items():
                    # Avoid partial word matches if possible, but these are tailwind classes so just regular replace is mostly fine.
                    # We will just do a standard string replace for now.
                    new_content = new_content.replace(old, new)
                
                if new_content != content:
                    with open(filepath, 'w') as f:
                        f.write(new_content)
                    print(f"Updated {filepath}")

if __name__ == '__main__':
    process_directory('src')
