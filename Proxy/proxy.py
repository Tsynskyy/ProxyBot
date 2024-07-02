# proxy.py

import globals
from telegram import Update
from telegram.ext import (
    ConversationHandler,
    CallbackContext
)
import subprocess
import re
import subprocess

from utils import empty_file

import sys
from pathlib import Path
import os

parent_dir = str(Path(__file__).resolve().parent.parent)
sys.path.append(parent_dir)

WAITING_FOR_INPUT = 0

list_file = "list.txt"
result_file = "RESULT.txt"
check_proxy_path = "check_proxy.js"
reboot_proxy_path = "reboot_proxy.js"


async def start_check_proxy(update: Update, context: CallbackContext):
    if globals.is_command_running:
        await update.message.reply_text(
            "Another command is currently running. Please wait.")
        return

    globals.is_command_running = True

    await update.message.reply_text("Список прокси можно отправить текстом или txt файлом")

    return WAITING_FOR_INPUT


async def check_proxy(update: Update, context: CallbackContext):

    if update.message.text:
        print("Пользователь отправил список прокси текстом")

        user_input = update.message.text
        with open(list_file, 'w', encoding='utf-8') as file:
            file.write(user_input)
    elif update.message.document:
        print("Пользователь отправил список прокси файлом")

        document = update.message.document
        file_id = document.file_id
        new_file = await context.bot.get_file(file_id)
        await new_file.download_to_drive(custom_path=list_file)
    else:
        print("Пользователь отправил не текст или файл")

        globals.is_command_running = False
        await start_check_proxy(update, context)

    Valid_list = await is_proxy_format_valid(update, list_file)

    if not Valid_list:
        globals.is_command_running = False

        await start_check_proxy(update, context)
    else:
        await update.message.reply_text("Список принят, запускаю проверку")

        subprocess.run(["node", check_proxy_path, "1"], text=True)

        with open(result_file, 'rb') as file:
            await context.bot.send_document(chat_id=update.effective_chat.id, document=file)

        if not empty_file(list_file):
            await update.message.reply_text("Список неработающих прокси")
            with open(list_file, 'rb') as file:
                await context.bot.send_document(chat_id=update.effective_chat.id, document=file)
        else:
            await update.message.reply_text("Все прокси работают")

        print("Проверка прокси завершена")
        globals.is_command_running = False
        return ConversationHandler.END


async def start_reboot_proxy(update: Update, context: CallbackContext):
    if globals.is_command_running:
        update.message.reply_text(
            "Another command is currently running. Please wait.")
        return

    globals.is_command_running = True

    await update.message.reply_text("Список прокси можно отправить текстом или txt файлом")
    return WAITING_FOR_INPUT


async def reboot_proxy(update: Update, context: CallbackContext):

    if update.message.text:
        print("Пользователь отправил список прокси текстом")

        user_input = update.message.text
        with open(list_file, 'w', encoding='utf-8') as file:
            file.write(user_input)
    elif update.message.document:
        print("Пользователь отправил список прокси файлом")

        document = update.message.document
        file_id = document.file_id
        new_file = await context.bot.get_file(file_id)
        await new_file.download_to_drive(custom_path=list_file)
    else:
        print("Пользователь отправил не текст или файл")

        globals.is_command_running = False
        await start_check_proxy(update, context)

    Valid_list = await is_proxy_format_valid(update, list_file)

    if not Valid_list:
        globals.is_command_running = False

        os.remove(list_file)

        await start_reboot_proxy(update, context)
    else:
        await update.message.reply_text("Список принят, запускаю перезагрузку прокси")

        subprocess.run(["node", reboot_proxy_path, "3"], text=True)

        print("Перезагрузка прокси завершена")

        if not empty_file(result_file):
            await update.message.reply_text("Результаты перезагрузки")

            with open(result_file, 'rb') as file:
                await context.bot.send_document(chat_id=update.effective_chat.id, document=file)

        if not empty_file(list_file):
            await update.message.reply_text("Список недоступных прокси")

            with open(list_file, 'rb') as file:
                await context.bot.send_document(chat_id=update.effective_chat.id, document=file)
        else:
            await update.message.reply_text("Все прокси перезагружены")

        os.remove(list_file)
        os.remove(result_file)
        globals.is_command_running = False
        return ConversationHandler.END


async def is_proxy_format_valid(update, file_path: str) -> bool:
    pattern = r'^[a-zA-Z0-9]+:[a-zA-Z0-9!]+@[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+$'

    try:
        await remove_datetime_from_strings(file_path)

        with open(file_path, 'r') as file:
            lines = file.readlines()

            lines = [line for line in lines if line.strip()]

            with open(file_path, 'w') as file:
                file.writelines(lines)

            if not lines:
                print(f"Файл {file_path} пуст")
                await update.message.reply_text("Список пуст")

                return False

            for line in lines:
                line = line.strip()

                if not re.match(pattern, line):
                    print("Список прокси имеет неверный формат")
                    await update.message.reply_text("Список прокси имеет неверный формат")
                    return False
    except FileNotFoundError:
        print(f"Файл {file_path} не найден")
        await update.message.reply_text(f"Файл {file_path} не найден")

        return False
    except Exception as e:
        print(f"Произошла ошибка при чтении файла: {e}")
        await update.message.reply_text("Неверное расширение файла")

        return False

    return True


async def remove_datetime_from_strings(file_path):
    processed_strings = []

    with open(file_path, "r") as file:
        for line in file:
            processed_string = re.sub(
                r"\s+\d{1,2}[/\.]\d{1,2}[/\.]\d{4},\s+\d{1,2}:\d{2}:\d{2}\s*(?:[APM]{2})?", "", line)
            processed_strings.append(processed_string)

    with open(file_path, "w") as f:
        for string in processed_strings:
            f.write(string + "\n")
