import re


def remove_datetime_from_strings(file_path):
    processed_strings = []

    with open(file_path, "r") as file:
        for line in file:
            processed_string = re.sub(
                r"\s+\d{1,2}[/\.]\d{1,2}[/\.]\d{4},\s+\d{1,2}:\d{2}:\d{2}\s*(?:[APM]{2})?", "", line)
            processed_strings.append(processed_string)

    with open("RESULT.txt", "w") as f:
        for string in processed_strings:
            f.write(string + "\n")


remove_datetime_from_strings("list.txt")
