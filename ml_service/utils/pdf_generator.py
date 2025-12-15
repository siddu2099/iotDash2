
# ========================================
# FILE 2: ml_service/utils/pdf_generator.py
# ========================================

"""
PDF Report Generator - Enhanced Dual-Sensor Reports
Generates clean, professional PDF reports with separate sensor analysis
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime
import io

class PDFReportGenerator:
    """Generate PDF reports for dual sensor data"""
    
    @staticmethod
    def generate_daily_report(report_data, health_data=None):
        """
        Generate a comprehensive daily PDF report for dual sensors
        
        Args:
            report_data (dict): Report data from DataReporter
            health_data (dict): Optional health data (can be None)
        
        Returns:
            io.BytesIO: PDF file in memory
        """
        buffer = io.BytesIO()
        
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=36,
        )
        
        elements = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=28,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=18,
            textColor=colors.HexColor('#34495e'),
            spaceAfter=15,
            spaceBefore=20,
            fontName='Helvetica-Bold'
        )
        
        subheading_style = ParagraphStyle(
            'CustomSubHeading',
            parent=styles['Heading3'],
            fontSize=14,
            textColor=colors.HexColor('#7f8c8d'),
            spaceAfter=10,
            fontName='Helvetica-Bold'
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#2c3e50')
        )
        
        # Title Section
        title = Paragraph("IoT Sensor Daily Report", title_style)
        elements.append(title)
        
        timestamp = datetime.now().strftime('%B %d, %Y at %I:%M %p')
        subtitle = Paragraph(
            f"<i>Generated on {timestamp}</i>", 
            ParagraphStyle('subtitle', parent=normal_style, alignment=TA_CENTER)
        )
        elements.append(subtitle)
        elements.append(Spacer(1, 0.3*inch))
        
        # Channel Info
        channel_id = report_data.get('channel_id', '3063140')
        channel_info = Paragraph(
            f"<b>Channel ID:</b> {channel_id} | <b>Platform:</b> ThingSpeak Cloud", 
            ParagraphStyle('channel', parent=normal_style, alignment=TA_CENTER)
        )
        elements.append(channel_info)
        elements.append(Spacer(1, 0.4*inch))
        
        # === METADATA SECTION ===
        metadata = report_data.get('metadata', {})
        elements.append(Paragraph("Report Overview", heading_style))
        
        overview_data = [
            ['Metric', 'Value'],
            ['Total Entries Analyzed', str(metadata.get('entries_analyzed', 'N/A'))],
            ['Time Period', metadata.get('time_span', 'N/A')],
            ['Report Generated', metadata.get('last_updated', 'N/A')]
        ]
        
        overview_table = Table(overview_data, colWidths=[3*inch, 3*inch])
        overview_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#ecf0f1')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#bdc3c7')),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('PADDING', (0, 1), (-1, -1), 8),
        ]))
        
        elements.append(overview_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # === FRONT SENSOR SECTION ===
        summary = report_data.get('summary', {})
        front_stats = summary.get('front_sensor', {})
        
        elements.append(Paragraph("📍 Front Sensor (Field 1)", heading_style))
        
        front_data = [
            ['Metric', 'Value'],
            ['Sample Count', str(front_stats.get('count', 0))],
            ['Mean', f"{front_stats.get('mean', 0)} cm"],
            ['Median', f"{front_stats.get('median', 0)} cm"],
            ['Std Deviation', f"{front_stats.get('std', 0)} cm"],
            ['Min Value', f"{front_stats.get('min', 0)} cm"],
            ['Max Value', f"{front_stats.get('max', 0)} cm"],
            ['Range', f"{front_stats.get('range', 0)} cm"],
            ['Q1 (25%)', f"{front_stats.get('q1', 0)} cm"],
            ['Q3 (75%)', f"{front_stats.get('q3', 0)} cm"],
        ]
        
        # Add trend if available
        front_trend = front_stats.get('trend', {})
        if front_trend:
            trend_str = front_trend.get('trend', 'N/A').upper()
            change = front_trend.get('change_percent', 0)
            front_data.append(['Trend', f"{trend_str} ({change:+.1f}%)"])
        
        front_table = Table(front_data, colWidths=[3*inch, 3*inch])
        front_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#d6eaf8')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#bdc3c7')),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('PADDING', (0, 1), (-1, -1), 8),
        ]))
        
        elements.append(front_table)
        elements.append(Spacer(1, 0.4*inch))
        
        # === BACK SENSOR SECTION ===
        back_stats = summary.get('back_sensor', {})
        
        elements.append(Paragraph("📍 Back Sensor (Field 2)", heading_style))
        
        back_data = [
            ['Metric', 'Value'],
            ['Sample Count', str(back_stats.get('count', 0))],
            ['Mean', f"{back_stats.get('mean', 0)} cm"],
            ['Median', f"{back_stats.get('median', 0)} cm"],
            ['Std Deviation', f"{back_stats.get('std', 0)} cm"],
            ['Min Value', f"{back_stats.get('min', 0)} cm"],
            ['Max Value', f"{back_stats.get('max', 0)} cm"],
            ['Range', f"{back_stats.get('range', 0)} cm"],
            ['Q1 (25%)', f"{back_stats.get('q1', 0)} cm"],
            ['Q3 (75%)', f"{back_stats.get('q3', 0)} cm"],
        ]
        
        # Add trend if available
        back_trend = back_stats.get('trend', {})
        if back_trend:
            trend_str = back_trend.get('trend', 'N/A').upper()
            change = back_trend.get('change_percent', 0)
            back_data.append(['Trend', f"{trend_str} ({change:+.1f}%)"])
        
        back_table = Table(back_data, colWidths=[3*inch, 3*inch])
        back_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2ecc71')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#d5f4e6')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#bdc3c7')),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('PADDING', (0, 1), (-1, -1), 8),
        ]))
        
        elements.append(back_table)
        elements.append(Spacer(1, 0.4*inch))
        
        # === CROSS-ANALYSIS SECTION ===
        cross = summary.get('cross_analysis', {})
        
        elements.append(Paragraph("🔄 Comparative Analysis", heading_style))
        
        comparison_data = [
            ['Metric', 'Value'],
            ['Average Difference', f"{cross.get('avg_difference', 0)} cm"],
            ['Front/Back Ratio', str(cross.get('front_back_ratio', 0))],
            ['Correlation', str(cross.get('correlation', 0))],
            ['Data Completeness', cross.get('data_completeness', '0%')],
            ['Front Sensor Readings', str(cross.get('readings_front', 0))],
            ['Back Sensor Readings', str(cross.get('readings_back', 0))],
        ]
        
        comparison_table = Table(comparison_data, colWidths=[3*inch, 3*inch])
        comparison_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#9b59b6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#e8daef')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#bdc3c7')),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('PADDING', (0, 1), (-1, -1), 8),
        ]))
        
        elements.append(comparison_table)
        elements.append(Spacer(1, 0.4*inch))
        
        # === DAILY TRENDS ===
        daily = report_data.get('daily', {})
        front_daily = daily.get('front_sensor', [])
        back_daily = daily.get('back_sensor', [])
        
        if front_daily or back_daily:
            elements.append(Paragraph("📅 Daily Statistics Summary", heading_style))
            
            # Front sensor daily (last 3 days)
            if front_daily:
                elements.append(Paragraph("Front Sensor - Recent Days:", subheading_style))
                front_daily_data = [['Date', 'Avg', 'Min', 'Max', 'Count']]
                for stat in front_daily[-3:]:
                    front_daily_data.append([
                        stat['day'],
                        f"{stat['avg']} cm",
                        f"{stat['min']} cm",
                        f"{stat['max']} cm",
                        str(stat['count'])
                    ])
                
                front_daily_table = Table(front_daily_data, colWidths=[1.8*inch, 1.1*inch, 1.1*inch, 1.1*inch, 0.9*inch])
                front_daily_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('PADDING', (0, 0), (-1, -1), 6),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#bdc3c7')),
                ]))
                elements.append(front_daily_table)
                elements.append(Spacer(1, 0.2*inch))
            
            # Back sensor daily (last 3 days)
            if back_daily:
                elements.append(Paragraph("Back Sensor - Recent Days:", subheading_style))
                back_daily_data = [['Date', 'Avg', 'Min', 'Max', 'Count']]
                for stat in back_daily[-3:]:
                    back_daily_data.append([
                        stat['day'],
                        f"{stat['avg']} cm",
                        f"{stat['min']} cm",
                        f"{stat['max']} cm",
                        str(stat['count'])
                    ])
                
                back_daily_table = Table(back_daily_data, colWidths=[1.8*inch, 1.1*inch, 1.1*inch, 1.1*inch, 0.9*inch])
                back_daily_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2ecc71')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('PADDING', (0, 0), (-1, -1), 6),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#bdc3c7')),
                ]))
                elements.append(back_daily_table)
        
        elements.append(Spacer(1, 0.5*inch))
        
        # === FOOTER ===
        footer_style = ParagraphStyle(
            'Footer',
            parent=normal_style,
            fontSize=8,
            textColor=colors.HexColor('#95a5a6'),
            alignment=TA_CENTER
        )
        
        footer = Paragraph(
            "This report was automatically generated by the IoT Monitoring System<br/>"
            f"ThingSpeak Channel: {channel_id} | ML Model: K-Means Clustering Anomaly Detection",
            footer_style
        )
        elements.append(footer)
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def get_filename():
        """Generate filename with current date"""
        date_str = datetime.now().strftime('%Y-%m-%d')
        return f"IoT_Dual_Sensor_Report_{date_str}.pdf"