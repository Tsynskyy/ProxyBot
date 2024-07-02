# utils.py

def empty_file(file_path):
    delete_duplicates(file_path)

    with open(file_path, 'r') as file:
        lines = file.readlines()

        lines = [line for line in lines if line.strip()]

        with open(file_path, 'w') as file:
            file.writelines(lines)

        if not lines:

            return True

    return False


def delete_empty_lines(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()

    non_empty_lines = [line for line in lines if line.strip()]

    with open(file_path, 'w') as file:
        file.writelines(non_empty_lines)


def delete_duplicates(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()

    unique_lines = set()
    new_lines = []

    for line in lines:
        trimmed_line = line.strip()
        if trimmed_line not in unique_lines:
            unique_lines.add(trimmed_line)
            new_lines.append(line)

    with open(file_path, 'w') as file:
        file.writelines(new_lines)
