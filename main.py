from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    ConversationHandler,
    MessageHandler,
    filters,
    CallbackContext
)

from Proxy.proxy import start_check_proxy, check_proxy, start_reboot_proxy, reboot_proxy
from Ping.ping import start_ping, ping
import globals

WAITING_FOR_INPUT = 0
WAITING_FOR_INPUT_PING = 1


async def handle_messages(update, context):
    msg = update.message.text

    await update.message.reply_text("Пожалуйста, отправьте команду")


async def cancel(update: Update, context: CallbackContext):
    await update.message.reply_text('Команда отменена.')

    globals.is_command_running = False

    return ConversationHandler.END


def main() -> None:
    print("Бот запускается")

    application = Application.builder().token('TOKEN').build()

    check_conv_handler = ConversationHandler(
        entry_points=[CommandHandler('check', start_check_proxy)],
        states={
            WAITING_FOR_INPUT: [MessageHandler(filters.TEXT & ~filters.COMMAND, check_proxy),
                                MessageHandler(filters.Document.ALL & ~filters.COMMAND, check_proxy)],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
    )

    application.add_handler(check_conv_handler)

    reboot_conv_handler = ConversationHandler(
        entry_points=[CommandHandler('reboot', start_reboot_proxy)],
        states={
            WAITING_FOR_INPUT: [MessageHandler(filters.TEXT & ~filters.COMMAND, reboot_proxy),
                                MessageHandler(filters.Document.ALL & ~filters.COMMAND, reboot_proxy)],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
    )

    application.add_handler(reboot_conv_handler)

    ping_conv_handler = ConversationHandler(
        entry_points=[CommandHandler('ping', start_ping)],
        states={
            WAITING_FOR_INPUT_PING: [MessageHandler(filters.TEXT & ~filters.COMMAND, ping),
                                     MessageHandler(filters.Document.ALL & ~filters.COMMAND, ping)],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
    )

    application.add_handler(ping_conv_handler)

    messages_handler = MessageHandler(
        filters.TEXT & ~filters.COMMAND, handle_messages)

    application.add_handler(messages_handler)

    print("Бот запущен")

    try:
        application.run_polling()
    except KeyboardInterrupt:
        print("Бот остановлен")


if __name__ == '__main__':
    main()
