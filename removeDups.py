from collections import OrderedDict

def remove_duplicates(input_filename, output_filename):
    print("Hello, World!")

    with open(input_filename, 'r') as file:
        lines = file.readlines()

    cleaned_data = OrderedDict()

    current_entry = []
    for line in lines:
        current_entry.append(line)
        if line == '\n':  # An empty line means new entry is about to start
            entry_str = ''.join(current_entry)
            cleaned_data[entry_str] = None  # Just use key to keep order and remove duplicates
            current_entry = []
    if current_entry:  # For the last entry if it doesn't end with an empty line
        entry_str = ''.join(current_entry)
        cleaned_data[entry_str] = None

    with open(output_filename, 'w') as file:
        file.write(''.join(cleaned_data.keys()))  # Write cleaned data to new file

# usage
remove_duplicates("./emailsOnly/CA/doulasCA.txt","./emailsOnly/CA/doulasCARemoveDups.txt")