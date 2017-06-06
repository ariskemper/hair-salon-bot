const _ = require('lodash')

module.exports = function(bp) {
  bp.middlewares.load()

  const currencySymbol = '€'

  const hairStyleService = [
    {
      'price': 15,
      'text': 'Cut/Style',
      'payload': 'SALON_SERVICE_CUT_STYLE',
      'order': 'order_cut'
    },
    {
      'price': 15,
      'text': 'Men\'s cut',
      'payload': 'SALON_SERVICE_MENS_CUT',
      'order': 'order_mens_cut'
    },
    {
      'price': 10,
      'text': 'Children',
      'payload': 'SALON_SERVICE_CHILDREN',
      'order': 'order_children'
    },
    {
      'price': 10,
      'text': 'Blowdry',
      'payload': 'SALON_SERVICE_BLOWDRY',
      'order': 'order_blowdry'
    },
    {
      'price': 15,
      'text': 'Chemical Blowdry',
      'payload': 'SALON_SERVICE_CHEMICAL_BLOWDRY',
      'order': 'order_chemical_blowdry'
    }
  ]

  const orderServiceQuickReply ={
    quick_replies: [
      {
        content_type: 'text',
        title: 'Yes',
        payload: 'YES'
      },
      {
        content_type: 'text',
        title: 'No',
        payload: 'NO'
      }
    ],
    typing:true
  }

  const optionsServiceQuickReplies = {
    quick_replies: [],
    typing: true,
    waitRead: true
  };

  hairStyleService.forEach((el) => {
    optionsServiceQuickReplies.quick_replies.push({
      content_type: "text",
      title: el.text,
      payload: el.payload
    })
  })

  const utterances = {
    hello: /hello|hello|hi|hey/i,
    yes: /yes|sure|ok/i,
    no: /no|not sure|not interested/i,
    stop: /stop|cancel|abort/i
  }

  const variants = {
    service_yes: () => _.sample(['Glad to hear that!', 'Fantastic!']),
    service_no: () => _.sample(['So sorry to hear that', ':('])
  }

  bp.hear(utterances.hello, (event, next) => {

    const txt = txt => bp.messenger.createText(event.user.id, txt)
    const quick = (message, quick_reply) => bp.messenger.createText(event.user.id, message, quick_reply)

    bp.convo.start(event, convo => {

      convo.messageTypes = ['text', 'message', 'postback', 'quick_reply']
      convo.threads['default'].addMessage(txt('Hello ' + event.user.first_name));
      convo.threads['default'].addQuestion(txt('Would you like to know more about our services?'), [
        {
          pattern: utterances.yes,
          callback: () => {
            convo.say(txt(variants.service_yes()))
            convo.switchTo('service')
          }
        },
        {
          pattern: utterances.no,
          callback: () => {
            convo.say(txt(variants.service_no()))
            convo.say(txt('Anyway..!'))
            convo.switchTo('default')
          }
        },
        {
          default: true,
          callback: () => {
            //Sent default custom message
            convo.say(txt('Sorry I dont understand'))
            // Repeats the last question / message
            convo.repeat()
          }
        }
      ])

      const service = []
      hairStyleService.forEach((item) => {
        service.push({
          pattern: item.payload,
          callback: () => {
            convo.set('order', item.order)
            convo.say(
              txt('You choose ' + item.text + ' hair. Price for the service is '  + item.price + ' ' + currencySymbol)
            )
            convo.switchTo('order')
            convo.next()
          }
        })
      })

      service.push( {
        default: true,
        callback: () => {
          //Sent default custom message
          convo.say(txt('Sorry I dont understand'))
          // Repeats the last question / message
          convo.repeat()
        }
      })

      convo.createThread('service')
      convo.threads['service'].addQuestion(quick("Please choose one of our service!", optionsServiceQuickReplies), service)

      convo.createThread('order')
      convo.threads['order'].addQuestion(quick("Would you like to order the service?", orderServiceQuickReply), [
        {
          pattern: utterances.yes,
          callback:(response) => {
            convo.say(txt(variants.service_yes()))
            const service = convo.get('order')
            // Save order in database
            // Do something with your response
          }
        },
        {
          pattern: utterances.no,
          callback:(response) => {
            convo.say(txt(variants.service_no()))
            convo.say(txt('Anyway..!'))
            convo.switchTo('default')
          }
        },
        {
          default:true,
          callback:()=>{
            //Sent default custom message
            convo.say(txt('Sorry I dont understand'))
            // Repeats the last question / message
            convo.repeat()
          }
        }
      ])

      convo.on('done', () => {
        convo.say(txt('This conversation is over now.'))
      })

      convo.on('aborted', () => {
        convo.say(txt('You aborted this conversation. Bye!'))
      })
    })

    bp.hear(utterances.stop, (event, next) => {
      const convo = bp.convo.find(event)
      convo && convo.stop('aborted')
    })
  })
}
